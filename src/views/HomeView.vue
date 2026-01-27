<template>
  <div class="home">
    <!-- Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ myBooks.length }}</div>
        <div class="stat-label">Books Read</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalPages }}</div>
        <div class="stat-label">Total Pages</div>
      </div>
    </div>

    <!-- Book list -->
    <h2 class="section-title">My Books</h2>
    
    <div v-if="loading" class="loading-state">
      Loading your books...
    </div>

    <div v-else-if="myBooks.length === 0" class="empty-state">
      <div class="empty-state-icon">📚</div>
      <div class="empty-state-title">No books yet</div>
      <p>Start your reading challenge by adding your first book!</p>
    </div>

    <div v-else>
      <div v-for="book in myBooks" :key="book.id" class="book-item">
        <span class="book-icon">📖</span>
        <div class="book-info">
          <div class="book-title">{{ book.title }}</div>
          <div class="book-author">{{ book.author }}</div>
          <div class="book-date">{{ formatDate(book.date_finished) }}</div>
        </div>
        <button class="book-delete" @click="deleteBook(book.id)" title="Delete">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../stores/user'

const { currentUser } = useUser()
const myBooks = ref([])
const loading = ref(true)

// Load books from Supabase
onMounted(async () => {
  await fetchBooks()
})

async function fetchBooks() {
  loading.value = true
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', currentUser.value.id)
    .order('date_finished', { ascending: false })
  
  if (error) {
    console.error('Error fetching books:', error)
  } else {
    myBooks.value = data
  }
  
  loading.value = false
}

const totalPages = computed(() => {
  return myBooks.value.reduce((sum, book) => sum + (book.pages || 0), 0)
})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function deleteBook(id) {
  if (confirm('Remove this book from your list?')) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book. Please try again.')
    } else {
      myBooks.value = myBooks.value.filter(book => book.id !== id)
    }
  }
}
</script>

<style scoped>
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-500);
}
</style>
