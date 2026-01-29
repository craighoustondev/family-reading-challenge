import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Fetch all books from all users, with user info and reading sessions.
 * Sorted by most recent activity (latest reading session or creation date).
 */
export async function fetchBooks() {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      users (
        id,
        name
      ),
      reading_sessions (
        id,
        pages_read,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching books:', error)
    return []
  }

  // Calculate total pages and latest activity for each book
  return (data || []).map(book => {
    const totalPages = book.reading_sessions?.reduce((sum, s) => sum + s.pages_read, 0) || 0
    const latestSession = book.reading_sessions?.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0]
    const latestActivity = latestSession?.created_at || book.created_at

    return {
      ...book,
      totalPages,
      latestActivity
    }
  })
}

/**
 * Fetch a single book by ID with all its reading sessions
 */
export async function fetchBook(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      users (
        id,
        name
      ),
      reading_sessions (
        id,
        pages_read,
        created_at
      )
    `)
    .eq('id', bookId)
    .single()

  if (error) {
    console.error('Error fetching book:', error)
    return null
  }

  if (data) {
    const totalPages = data.reading_sessions?.reduce((sum, s) => sum + s.pages_read, 0) || 0
    return {
      ...data,
      totalPages,
      reading_sessions: data.reading_sessions?.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ) || []
    }
  }

  return null
}

/**
 * Add a new book
 */
export async function addBook({ title, author, userId }) {
  if (!title || title.trim().length === 0) {
    return { data: null, error: { message: 'Title is required' } }
  }

  const { data, error } = await supabase
    .from('books')
    .insert({
      title: title.trim(),
      author: author?.trim() || null,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding book:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Add a reading session (log pages read)
 */
export async function addReadingSession({ bookId, pagesRead }) {
  if (!pagesRead || pagesRead <= 0) {
    return { data: null, error: { message: 'Pages must be greater than 0' } }
  }

  const { data, error } = await supabase
    .from('reading_sessions')
    .insert({
      book_id: bookId,
      pages_read: pagesRead
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding reading session:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Mark a book as completed
 */
export async function markBookCompleted(bookId) {
  const { data, error } = await supabase
    .from('books')
    .update({
      completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', bookId)
    .select()
    .single()

  if (error) {
    console.error('Error marking book as completed:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Delete a book and its reading sessions
 */
export async function deleteBook(bookId) {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)

  if (error) {
    console.error('Error deleting book:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Fetch all reading sessions (for scoring calculations)
 */
export async function fetchAllReadingSessions() {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select(`
      *,
      books (
        user_id
      )
    `)

  if (error) {
    console.error('Error fetching reading sessions:', error)
    return []
  }

  return data || []
}

/**
 * Composable for use in Vue components
 */
export function useBooks() {
  const books = ref([])
  const currentBook = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadBooks() {
    loading.value = true
    error.value = null

    try {
      books.value = await fetchBooks()
    } catch (e) {
      error.value = 'Failed to load books'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function loadBook(bookId) {
    loading.value = true
    error.value = null

    try {
      currentBook.value = await fetchBook(bookId)
    } catch (e) {
      error.value = 'Failed to load book'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    books,
    currentBook,
    loading,
    error,
    loadBooks,
    loadBook,
    fetchBooks,
    fetchBook,
    addBook,
    addReadingSession,
    markBookCompleted,
    deleteBook,
    fetchAllReadingSessions
  }
}
