<template>
  <div class="book-detail">
    <div v-if="loading" class="loading">
      Loading book...
    </div>

    <div v-else-if="!book" class="not-found">
      <div class="card">
        <p>Book not found.</p>
        <router-link to="/" class="btn btn-primary">Back to Home</router-link>
      </div>
    </div>

    <template v-else>
      <!-- Book Header -->
      <div class="card book-header">
        <div class="book-status" :class="{ completed: book.completed }">
          {{ book.completed ? '✅ Completed' : '📖 Reading' }}
        </div>
        <h1 class="book-title">{{ book.title }}</h1>
        <p v-if="book.author" class="book-author">by {{ book.author }}</p>
        <p class="book-reader">
          {{ book.users?.name }} · {{ book.totalPages }} pages read
        </p>
      </div>

      <!-- Log Pages (only for book owner, not completed) -->
      <div v-if="isOwner && !book.completed" class="card">
        <h2 class="section-title">Log Reading Session</h2>
        <form @submit.prevent="handleLogPages" class="log-form">
          <div class="form-group">
            <label class="form-label" for="pages">Pages read</label>
            <input 
              id="pages"
              v-model.number="pagesToLog"
              type="number"
              min="1"
              class="form-input"
              placeholder="e.g. 25"
              required
            />
          </div>
          <button type="submit" class="btn btn-success btn-full" :disabled="logging">
            {{ logging ? 'Logging...' : '📝 Log Pages' }}
          </button>
        </form>
        <p v-if="logSuccess" class="success-text">✅ Pages logged! +{{ pagesToLog }} points</p>
        <p v-if="logError" class="error-text">❌ {{ logError }}</p>
      </div>

      <!-- Mark Complete (only for book owner, not completed) -->
      <div v-if="isOwner && !book.completed" class="card">
        <h2 class="section-title">Finished the book?</h2>
        <p class="completion-hint">Mark as complete to earn a 100 point bonus!</p>
        <button 
          @click="handleMarkComplete" 
          class="btn btn-primary btn-full"
          :disabled="completing"
        >
          {{ completing ? 'Completing...' : '🎉 Mark as Complete' }}
        </button>
      </div>

      <!-- Reading History -->
      <div class="card">
        <h2 class="section-title">Reading History</h2>
        <div v-if="book.reading_sessions?.length === 0" class="empty-history">
          No reading sessions logged yet.
        </div>
        <ul v-else class="session-list">
          <li v-for="session in book.reading_sessions" :key="session.id" class="session-item">
            <span class="session-pages">{{ session.pages_read }} pages</span>
            <span class="session-date">{{ formatDate(session.created_at) }}</span>
          </li>
        </ul>
      </div>

      <!-- Delete (only for book owner) -->
      <div v-if="isOwner" class="card danger-zone">
        <h2 class="section-title">Danger Zone</h2>
        <button 
          @click="handleDelete" 
          class="btn btn-danger btn-full"
          :disabled="deleting"
        >
          {{ deleting ? 'Deleting...' : '🗑️ Delete Book' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '../stores/user'
import { fetchBook, addReadingSession, markBookCompleted, deleteBook } from '../stores/books'

const route = useRoute()
const router = useRouter()
const { currentUser } = useUser()

const book = ref(null)
const loading = ref(true)
const pagesToLog = ref(null)
const logging = ref(false)
const logSuccess = ref(false)
const logError = ref('')
const completing = ref(false)
const deleting = ref(false)

const isOwner = computed(() => {
  return book.value?.user_id === currentUser.value?.id
})

onMounted(async () => {
  await loadBook()
})

async function loadBook() {
  loading.value = true
  book.value = await fetchBook(route.params.id)
  loading.value = false
}

async function handleLogPages() {
  if (!pagesToLog.value || pagesToLog.value <= 0) return

  logging.value = true
  logError.value = ''
  logSuccess.value = false

  const result = await addReadingSession({
    bookId: book.value.id,
    pagesRead: pagesToLog.value,
    bookTitle: book.value.title,
    userName: currentUser.value.name,
    userId: currentUser.value.id
  })

  logging.value = false

  if (result.error) {
    logError.value = result.error.message
    return
  }

  logSuccess.value = true
  
  // Reload book to get updated sessions
  await loadBook()
  
  // Reset form after a moment
  setTimeout(() => {
    logSuccess.value = false
    pagesToLog.value = null
  }, 2000)
}

async function handleMarkComplete() {
  if (!confirm('Mark this book as complete?')) return

  completing.value = true

  const result = await markBookCompleted(book.value.id)

  completing.value = false

  if (result.error) {
    alert('Failed to mark as complete: ' + result.error.message)
    return
  }

  // Send notification about completion
  sendCompletionNotification()

  // Reload book
  await loadBook()
}

async function sendCompletionNotification() {
  try {
    await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Book Completed!',
        body: `${currentUser.value.name} finished reading "${book.value.title}"`,
        url: `/book/${book.value.id}`,
        excludeUserId: currentUser.value.id
      })
    })
  } catch (err) {
    console.error('Failed to send notification:', err)
  }
}

async function handleDelete() {
  if (!confirm('Delete this book and all reading history? This cannot be undone.')) return

  deleting.value = true

  const result = await deleteBook(book.value.id)

  deleting.value = false

  if (result.error) {
    alert('Failed to delete: ' + result.error.message)
    return
  }

  router.push('/')
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.book-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading,
.not-found {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.book-header {
  text-align: center;
}

.book-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--primary-light);
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.book-status.completed {
  background: #dcfce7;
  color: #166534;
}

.book-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
}

.book-author {
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.book-reader {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.log-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-text {
  color: #166534;
  text-align: center;
  margin-top: 0.5rem;
}

.error-text {
  color: #991b1b;
  text-align: center;
  margin-top: 0.5rem;
}

.completion-hint {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.empty-history {
  color: var(--gray-500);
  text-align: center;
  padding: 1rem;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.session-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--gray-100);
}

.session-item:last-child {
  border-bottom: none;
}

.session-pages {
  font-weight: 500;
  color: var(--gray-900);
}

.session-date {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.danger-zone {
  border-color: #fecaca;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
