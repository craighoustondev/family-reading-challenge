<template>
  <div class="home">
    <!-- Welcome message -->
    <div class="welcome-card">
      <h2>Welcome, {{ currentUser?.name }}!</h2>
      <p>See what your family is sharing</p>
    </div>

    <!-- Combined Feed -->
    <h2 class="section-title">Family Feed</h2>
    
    <div v-if="loading" class="loading-state">
      Loading...
    </div>

    <div v-else-if="feedItems.length === 0" class="empty-state">
      <div class="empty-state-icon">📚</div>
      <div class="empty-state-title">Nothing shared yet</div>
      <p>Be the first to share an article or add a book!</p>
    </div>

    <div v-else class="feed-list">
      <template v-for="item in feedItems" :key="item.id + '-' + item.type">
        <!-- Book Card -->
        <router-link 
          v-if="item.type === 'book'"
          :to="`/book/${item.id}`"
          class="feed-item book-item"
        >
          <div class="item-icon">📚</div>
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div v-if="item.author" class="item-subtitle">by {{ item.author }}</div>
            <div class="item-meta">
              <span class="item-user">{{ item.users?.name }}</span>
              <span class="item-status" :class="{ completed: item.completed }">
                {{ item.completed ? '✅ Completed' : '📖 Reading' }}
              </span>
              <span class="item-pages">{{ item.totalPages }} pages</span>
            </div>
          </div>
        </router-link>

        <!-- Article Card -->
        <div v-else class="feed-item article-item">
          <div class="article-content">
            <a :href="item.url" target="_blank" rel="noopener noreferrer" class="article-link">
              <span class="article-title">{{ item.title || extractDomain(item.url) }}</span>
              <span class="article-url">{{ extractDomain(item.url) }}</span>
            </a>
            
            <div class="article-meta">
              <span class="article-sharer">Shared by {{ item.users?.name || 'Unknown' }}</span>
              <span class="article-time">{{ formatRelativeTime(item.created_at) }}</span>
            </div>

            <!-- Comments Section -->
            <div class="comments-section">
              <button 
                class="comments-toggle"
                @click="toggleComments(item.id)"
              >
                💬 {{ getCommentCount(item.id) }} {{ getCommentCount(item.id) === 1 ? 'comment' : 'comments' }}
                <span class="toggle-arrow">{{ expandedArticles[item.id] ? '▼' : '▶' }}</span>
              </button>

              <div v-if="expandedArticles[item.id]" class="comments-expanded">
                <!-- Existing comments -->
                <div v-if="articleComments[item.id]?.length > 0" class="comments-list">
                  <div 
                    v-for="comment in articleComments[item.id]" 
                    :key="comment.id" 
                    class="comment"
                  >
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.users?.name }}</span>
                      <span class="comment-time">{{ formatRelativeTime(comment.created_at) }}</span>
                    </div>
                    
                    <!-- Edit mode -->
                    <div v-if="editingCommentId === comment.id" class="comment-edit-form">
                      <textarea
                        v-model="editingCommentContent"
                        class="comment-textarea"
                        rows="2"
                      ></textarea>
                      <div class="comment-edit-actions">
                        <button class="btn btn-small btn-primary" @click="saveCommentEdit(comment)" :disabled="savingComment">
                          Save
                        </button>
                        <button class="btn btn-small" @click="cancelCommentEdit">Cancel</button>
                      </div>
                    </div>
                    
                    <!-- Display mode -->
                    <div v-else>
                      <p class="comment-content">{{ comment.content }}</p>
                      <div v-if="comment.user_id === currentUser?.id" class="comment-actions">
                        <button class="comment-action-btn" @click="startEditComment(comment)">Edit</button>
                        <button class="comment-action-btn" @click="handleDeleteComment(item.id, comment)">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add comment form (if user hasn't commented yet) -->
                <div v-if="!userHasCommented(item.id)" class="add-comment-form">
                  <textarea
                    v-model="newComments[item.id]"
                    class="comment-textarea"
                    placeholder="Add your comment..."
                    rows="2"
                  ></textarea>
                  <button 
                    class="btn btn-small btn-primary"
                    @click="handleAddComment(item.id)"
                    :disabled="!newComments[item.id]?.trim() || savingComment"
                  >
                    {{ savingComment ? 'Posting...' : 'Post Comment' }}
                  </button>
                </div>

                <!-- Show message if user already commented -->
                <div v-else class="already-commented">
                  <span>✓ You've commented on this article</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            v-if="item.user_id === currentUser?.id"
            class="article-delete" 
            @click="handleDelete(item.id)" 
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUser } from '../stores/user'
import { useArticles } from '../stores/articles'
import { useBooks } from '../stores/books'
import { fetchCommentsForArticle, addComment, updateComment, deleteComment } from '../stores/comments'

const { currentUser } = useUser()
const { articles, loading: articlesLoading, loadArticles, deleteArticle } = useArticles()
const { books, loading: booksLoading, loadBooks } = useBooks()

// Combined loading state
const loading = computed(() => articlesLoading.value || booksLoading.value)

// Combined feed sorted by most recent activity
const feedItems = computed(() => {
  const articleItems = articles.value.map(a => ({
    ...a,
    type: 'article',
    sortDate: new Date(a.created_at)
  }))
  
  const bookItems = books.value.map(b => ({
    ...b,
    type: 'book',
    sortDate: new Date(b.latestActivity || b.created_at)
  }))
  
  return [...articleItems, ...bookItems].sort((a, b) => b.sortDate - a.sortDate)
})

// Comments state
const articleComments = reactive({})
const expandedArticles = reactive({})
const newComments = reactive({})
const editingCommentId = ref(null)
const editingCommentContent = ref('')
const savingComment = ref(false)

onMounted(() => {
  loadArticles()
  loadBooks()
})

// Load comments for all articles when articles change
watch(articles, async (newArticles) => {
  if (newArticles.length > 0) {
    await loadAllComments(newArticles)
  }
}, { immediate: true })

async function loadAllComments(articlesList) {
  // Load comments for all articles in parallel
  const promises = articlesList.map(async (article) => {
    if (!articleComments[article.id]) {
      articleComments[article.id] = await fetchCommentsForArticle(article.id)
    }
  })
  await Promise.all(promises)
}

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

async function toggleComments(articleId) {
  expandedArticles[articleId] = !expandedArticles[articleId]
  
  // Load comments if expanding and not already loaded
  if (expandedArticles[articleId] && !articleComments[articleId]) {
    articleComments[articleId] = await fetchCommentsForArticle(articleId)
  }
}

function getCommentCount(articleId) {
  return articleComments[articleId]?.length || 0
}

function userHasCommented(articleId) {
  const comments = articleComments[articleId] || []
  return comments.some(c => c.user_id === currentUser.value?.id)
}

async function handleAddComment(articleId) {
  const content = newComments[articleId]?.trim()
  if (!content) return

  savingComment.value = true
  
  const { error } = await addComment({
    articleId,
    userId: currentUser.value.id,
    content
  })
  
  savingComment.value = false
  
  if (error) {
    alert('Failed to post comment. Please try again.')
    return
  }
  
  // Refresh comments
  articleComments[articleId] = await fetchCommentsForArticle(articleId)
  newComments[articleId] = ''
}

function startEditComment(comment) {
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
}

function cancelCommentEdit() {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

async function saveCommentEdit(comment) {
  if (!editingCommentContent.value.trim()) return
  
  savingComment.value = true
  
  const { error } = await updateComment({
    commentId: comment.id,
    content: editingCommentContent.value,
    userId: currentUser.value.id,
    ownerId: comment.user_id
  })
  
  savingComment.value = false
  
  if (error) {
    alert('Failed to update comment. Please try again.')
    return
  }
  
  // Update local state
  comment.content = editingCommentContent.value.trim()
  cancelCommentEdit()
}

async function handleDeleteComment(articleId, comment) {
  if (!confirm('Delete this comment?')) return
  
  const { error } = await deleteComment({
    commentId: comment.id,
    userId: currentUser.value.id,
    ownerId: comment.user_id
  })
  
  if (error) {
    alert('Failed to delete comment. Please try again.')
    return
  }
  
  // Refresh comments
  articleComments[articleId] = await fetchCommentsForArticle(articleId)
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

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
  text-decoration: none;
  color: inherit;
}

/* Book specific styles */
.book-item {
  border-left: 4px solid var(--primary);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.book-item:hover {
  border-color: var(--primary-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.125rem;
}

.item-subtitle {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.item-user {
  font-weight: 500;
}

.item-status {
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}

.item-status.completed {
  background: #dcfce7;
  color: #166534;
}

.item-pages {
  color: var(--gray-500);
}

/* Article specific styles */
.article-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
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
  margin-bottom: 0.75rem;
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

/* Comments */
.comments-section {
  margin-top: 0.5rem;
  border-top: 1px solid var(--gray-100);
  padding-top: 0.5rem;
}

.comments-toggle {
  background: none;
  border: none;
  font-size: 0.875rem;
  color: var(--gray-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.comments-toggle:hover {
  color: var(--primary);
}

.toggle-arrow {
  font-size: 0.625rem;
}

.comments-expanded {
  margin-top: 0.75rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.comment {
  background: var(--gray-50);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.comment-author {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.comment-time {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.comment-content {
  font-size: 0.875rem;
  color: var(--gray-700);
  margin: 0;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.comment-action-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  color: var(--gray-500);
  cursor: pointer;
  padding: 0;
}

.comment-action-btn:hover {
  color: var(--primary);
}

.add-comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.comment-edit-form {
  margin-top: 0.5rem;
}

.comment-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.already-commented {
  font-size: 0.875rem;
  color: var(--gray-500);
  font-style: italic;
}
</style>
