import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Fetch all comments for a specific article.
 * Includes the commenter's name.
 */
export async function fetchCommentsForArticle(articleId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      users (
        id,
        name
      )
    `)
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data || []
}

/**
 * Add a comment to an article.
 * Each user can only have one comment per article (upsert behavior).
 */
export async function addComment({ articleId, userId, content }) {
  // Validation: content is required
  if (!content || content.trim().length === 0) {
    return { data: null, error: { message: 'Comment content is required' } }
  }

  const trimmedContent = content.trim()

  // Upsert: insert or update if user already has a comment on this article
  const { data, error } = await supabase
    .from('comments')
    .upsert({
      article_id: articleId,
      user_id: userId,
      content: trimmedContent
    }, {
      onConflict: 'article_id,user_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Update a comment.
 * Only the comment owner can update it.
 */
export async function updateComment({ commentId, content, userId, ownerId }) {
  // Permission check
  if (userId !== ownerId) {
    return { data: null, error: { message: 'You can only edit your own comment' } }
  }

  // Validation: content is required
  if (!content || content.trim().length === 0) {
    return { data: null, error: { message: 'Comment content is required' } }
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ content: content.trim() })
    .eq('id', commentId)

  if (error) {
    console.error('Error updating comment:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Delete a comment.
 * Only the comment owner can delete it.
 */
export async function deleteComment({ commentId, userId, ownerId }) {
  // Permission check
  if (userId !== ownerId) {
    return { error: { message: 'You can only delete your own comment' } }
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Composable for use in Vue components
 */
export function useComments(articleId) {
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadComments() {
    if (!articleId) return
    
    loading.value = true
    error.value = null
    
    try {
      comments.value = await fetchCommentsForArticle(articleId)
    } catch (e) {
      error.value = 'Failed to load comments'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    comments,
    loading,
    error,
    loadComments,
    addComment,
    updateComment,
    deleteComment
  }
}
