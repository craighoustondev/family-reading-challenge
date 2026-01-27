<template>
  <div class="home">
    <!-- Welcome message -->
    <div class="welcome-card">
      <h2>Welcome, {{ currentUser?.name }}!</h2>
      <p>See what your family is reading</p>
    </div>

    <!-- Articles list -->
    <h2 class="section-title">Shared Articles</h2>
    
    <div v-if="loading" class="loading-state">
      Loading articles...
    </div>

    <div v-else-if="articles.length === 0" class="empty-state">
      <div class="empty-state-icon">📰</div>
      <div class="empty-state-title">No articles shared yet</div>
      <p>Be the first to share an interesting article with your family!</p>
    </div>

    <div v-else class="articles-list">
      <div v-for="article in articles" :key="article.id" class="article-item">
        <div class="article-content">
          <a :href="article.url" target="_blank" rel="noopener noreferrer" class="article-link">
            <span class="article-title">{{ article.title || extractDomain(article.url) }}</span>
            <span class="article-url">{{ extractDomain(article.url) }}</span>
          </a>
          <div class="article-meta">
            <span class="article-sharer">Shared by {{ article.users?.name || 'Unknown' }}</span>
            <span class="article-time">{{ formatRelativeTime(article.created_at) }}</span>
          </div>
        </div>
        <button 
          v-if="article.user_id === currentUser?.id"
          class="article-delete" 
          @click="handleDelete(article.id)" 
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUser } from '../stores/user'
import { useArticles } from '../stores/articles'

const { currentUser } = useUser()
const { articles, loading, loadArticles, deleteArticle } = useArticles()

onMounted(() => {
  loadArticles()
})

function extractDomain(url) {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return url
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function handleDelete(id) {
  if (confirm('Delete this article?')) {
    const { error } = await deleteArticle(id)
    if (!error) {
      await loadArticles()
    } else {
      alert('Failed to delete article. Please try again.')
    }
  }
}
</script>

<style scoped>
.welcome-card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.welcome-card h2 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.welcome-card p {
  font-size: 0.875rem;
  opacity: 0.9;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-500);
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.article-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
}

.article-content {
  flex: 1;
  min-width: 0;
}

.article-link {
  display: block;
  text-decoration: none;
  margin-bottom: 0.5rem;
}

.article-title {
  display: block;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
  word-break: break-word;
}

.article-link:hover .article-title {
  color: var(--primary);
}

.article-url {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.article-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.article-sharer {
  font-weight: 500;
}

.article-delete {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.article-delete:hover {
  opacity: 1;
}
</style>
