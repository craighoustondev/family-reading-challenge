import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'

// We'll test the articles store/service that we're about to create
// These tests define the expected behavior

describe('Articles Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetching Articles', () => {
    it('should fetch all articles from all users', async () => {
      // Given: Multiple users have shared articles
      const mockArticles = [
        {
          id: '1',
          url: 'https://example.com/article-1',
          title: 'Interesting News',
          user_id: 'user-1',
          created_at: '2026-01-27T10:00:00Z',
          users: { id: 'user-1', name: 'Craig' }
        },
        {
          id: '2',
          url: 'https://example.com/article-2',
          title: 'Another Story',
          user_id: 'user-2',
          created_at: '2026-01-26T10:00:00Z',
          users: { id: 'user-2', name: 'Mom' }
        }
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      })

      // When: We fetch articles
      const { fetchArticles } = await import('../stores/articles')
      const articles = await fetchArticles()

      // Then: We should get all articles with user info
      expect(supabase.from).toHaveBeenCalledWith('articles')
      expect(articles).toHaveLength(2)
      expect(articles[0].users.name).toBe('Craig')
      expect(articles[1].users.name).toBe('Mom')
    })

    it('should return articles sorted by most recent first', async () => {
      const mockArticles = [
        { id: '1', created_at: '2026-01-27T10:00:00Z' },
        { id: '2', created_at: '2026-01-26T10:00:00Z' }
      ]

      const orderMock = vi.fn().mockResolvedValue({ data: mockArticles, error: null })
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: orderMock
        })
      })

      const { fetchArticles } = await import('../stores/articles')
      await fetchArticles()

      // Then: Should order by created_at descending
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should return empty array when no articles exist', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })

      const { fetchArticles } = await import('../stores/articles')
      const articles = await fetchArticles()

      expect(articles).toEqual([])
    })

    it('should handle fetch errors gracefully', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Network error' } 
          })
        })
      })

      const { fetchArticles } = await import('../stores/articles')
      const articles = await fetchArticles()

      // Should return empty array on error, not throw
      expect(articles).toEqual([])
    })
  })

  describe('Adding Articles', () => {
    it('should add a new article with the current user ID', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'new-article-id', url: 'https://example.com/news' }, 
            error: null 
          })
        })
      })

      supabase.from.mockReturnValue({
        insert: insertMock
      })

      const { addArticle } = await import('../stores/articles')
      const result = await addArticle({
        url: 'https://example.com/news',
        title: 'Breaking News',
        userId: 'user-123'
      })

      // Then: Should insert with correct data
      expect(supabase.from).toHaveBeenCalledWith('articles')
      expect(insertMock).toHaveBeenCalledWith({
        url: 'https://example.com/news',
        title: 'Breaking News',
        user_id: 'user-123'
      })
      expect(result.error).toBeNull()
    })

    it('should require a URL to add an article', async () => {
      const { addArticle } = await import('../stores/articles')
      const result = await addArticle({
        url: '',
        title: 'No URL',
        userId: 'user-123'
      })

      // Should return validation error
      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('URL')
    })

    it('should require a valid URL format', async () => {
      const { addArticle } = await import('../stores/articles')
      const result = await addArticle({
        url: 'not-a-valid-url',
        title: 'Invalid',
        userId: 'user-123'
      })

      expect(result.error).toBeTruthy()
      expect(result.error.message).toContain('valid URL')
    })

    it('should handle database errors when adding', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          })
        })
      })

      const { addArticle } = await import('../stores/articles')
      const result = await addArticle({
        url: 'https://example.com/news',
        title: 'Test',
        userId: 'user-123'
      })

      expect(result.error).toBeTruthy()
    })
  })

  describe('Article Display', () => {
    it('should include the sharer name with each article', async () => {
      const mockArticles = [
        {
          id: '1',
          url: 'https://example.com/article',
          users: { name: 'Craig' }
        }
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      })

      const { fetchArticles } = await import('../stores/articles')
      const articles = await fetchArticles()

      expect(articles[0].users.name).toBe('Craig')
    })

    it('should include created_at timestamp for relative time display', async () => {
      const mockArticles = [
        {
          id: '1',
          url: 'https://example.com/article',
          created_at: '2026-01-27T10:00:00Z',
          users: { name: 'Craig' }
        }
      ]

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockArticles, error: null })
        })
      })

      const { fetchArticles } = await import('../stores/articles')
      const articles = await fetchArticles()

      expect(articles[0].created_at).toBeDefined()
    })
  })
})
