import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Fetch all articles from all users, sorted by most recent first.
 * Includes the user info (name) for each article.
 */
export async function fetchArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      users (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return data || []
}

/**
 * Send push notification to all other users about a new article
 */
async function sendNewArticleNotification({ title, url, userName, userId }) {
  try {
    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'New Article Shared!',
        body: `${userName} shared: ${title || url}`,
        url: '/',
        excludeUserId: userId
      })
    })

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text())
    }
  } catch (error) {
    // Don't fail the article creation if notification fails
    console.error('Error sending notification:', error)
  }
}

/**
 * Add a new article.
 * Validates URL format before inserting.
 */
export async function addArticle({ url, title, userId, userName }) {
  // Validation: URL is required
  if (!url || url.trim().length === 0) {
    return { data: null, error: { message: 'URL is required' } }
  }

  // Validation: Must be a valid HTTP/HTTPS URL
  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(url)) {
    return { data: null, error: { message: 'Please enter a valid URL (starting with http:// or https://)' } }
  }

  // Insert into database
  const { data, error } = await supabase
    .from('articles')
    .insert({
      url: url.trim(),
      title: title?.trim() || null,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding article:', error)
    return { data: null, error }
  }

  // Send push notification to other users (don't await to avoid blocking)
  sendNewArticleNotification({
    title: title?.trim() || null,
    url: url.trim(),
    userName: userName || 'Someone',
    userId
  })

  return { data, error: null }
}

/**
 * Delete an article by ID
 */
export async function deleteArticle(id) {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting article:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Composable for use in Vue components
 */
export function useArticles() {
  const articles = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadArticles() {
    loading.value = true
    error.value = null
    
    try {
      articles.value = await fetchArticles()
    } catch (e) {
      error.value = 'Failed to load articles'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    articles,
    loading,
    error,
    loadArticles,
    fetchArticles,
    addArticle,
    deleteArticle
  }
}
