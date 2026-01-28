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

          <!-- Comments Section -->
          <div class="comments-section">
            <button 
              class="comments-toggle"
              @click="toggleComments(article.id)"
            >
              💬 {{ getCommentCount(article.id) }} {{ getCommentCount(article.id) === 1 ? 'comment' : 'comments' }}
              <span class="toggle-arrow">{{ expandedArticles[article.id] ? '▼' : '▶' }}</span>
            </button>

            <div v-if="expandedArticles[article.id]" class="comments-expanded">
              <!-- Existing comments -->
              <div v-if="articleComments[article.id]?.length > 0" class="comments-list">
                <div 
                  v-for="comment in articleComments[article.id]" 
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
                      <button class="comment-action-btn" @click="handleDeleteComment(article.id, comment)">Delete</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Add comment form (if user hasn't commented yet) -->
              <div v-if="!userHasCommented(article.id)" class="add-comment-form">
                <textarea
                  v-model="newComments[article.id]"
                  class="comment-textarea"
                  placeholder="Add your comment..."
                  rows="2"
                ></textarea>
                <button 
                  class="btn btn-small btn-primary"
                  @click="handleAddComment(article.id)"
                  :disabled="!newComments[article.id]?.trim() || savingComment"
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useUser } from '../stores/user'
import { useArticles } from '../stores/articles'
import { fetchCommentsForArticle, addComment, updateComment, deleteComment } from '../stores/comments'

const { currentUser } = useUser()
const { articles, loading, loadArticles, deleteArticle } = useArticles()

// Comments state
const articleComments = reactive({})
const expandedArticles = reactive({})
const newComments = reactive({})
const editingCommentId = ref(null)
const editingCommentContent = ref('')
const savingComment = ref(false)

onMounted(() => {
  loadArticles()
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
