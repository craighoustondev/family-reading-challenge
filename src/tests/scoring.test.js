import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'

describe('Scoring System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Article Points', () => {
    it('should award 10 points for each article shared', () => {
      const POINTS_PER_ARTICLE = 10
      const articleCount = 5
      
      const score = articleCount * POINTS_PER_ARTICLE
      
      expect(score).toBe(50)
    })

    it('should calculate total score based on article count', async () => {
      // Given: A user with 3 articles
      const userArticles = [
        { id: '1', user_id: 'user-123' },
        { id: '2', user_id: 'user-123' },
        { id: '3', user_id: 'user-123' }
      ]

      // When: We calculate their score
      const { calculateUserScore } = await import('../stores/scoring')
      const score = calculateUserScore({ articleCount: userArticles.length })

      // Then: Should be 30 points (3 articles × 10 points)
      expect(score).toBe(30)
    })

    it('should return 0 for users with no articles', async () => {
      const { calculateUserScore } = await import('../stores/scoring')
      const score = calculateUserScore({ articleCount: 0 })

      expect(score).toBe(0)
    })
  })

  describe('Leaderboard Scores', () => {
    it('should calculate scores for all users', async () => {
      // Given: Multiple users with different article counts
      const users = [
        { id: 'user-1', name: 'Craig' },
        { id: 'user-2', name: 'Mom' },
        { id: 'user-3', name: 'Dad' }
      ]
      
      const articles = [
        { user_id: 'user-1' },
        { user_id: 'user-1' },
        { user_id: 'user-1' },  // Craig: 3 articles = 30 points
        { user_id: 'user-2' },
        { user_id: 'user-2' },  // Mom: 2 articles = 20 points
        // Dad: 0 articles = 0 points
      ]

      // When: We calculate leaderboard
      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles)

      // Then: Should have correct scores sorted by points
      expect(leaderboard[0].name).toBe('Craig')
      expect(leaderboard[0].points).toBe(30)
      expect(leaderboard[1].name).toBe('Mom')
      expect(leaderboard[1].points).toBe(20)
      expect(leaderboard[2].name).toBe('Dad')
      expect(leaderboard[2].points).toBe(0)
    })

    it('should sort leaderboard by points descending', async () => {
      const users = [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
        { id: 'user-3', name: 'Charlie' }
      ]
      
      const articles = [
        { user_id: 'user-2' },  // Bob: 1 article
        { user_id: 'user-3' },
        { user_id: 'user-3' },
        { user_id: 'user-3' },  // Charlie: 3 articles (highest)
        { user_id: 'user-1' },
        { user_id: 'user-1' },  // Alice: 2 articles
      ]

      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles)

      // Should be sorted: Charlie (30), Alice (20), Bob (10)
      expect(leaderboard[0].name).toBe('Charlie')
      expect(leaderboard[1].name).toBe('Alice')
      expect(leaderboard[2].name).toBe('Bob')
    })

    it('should include article count in leaderboard entry', async () => {
      const users = [{ id: 'user-1', name: 'Craig' }]
      const articles = [
        { user_id: 'user-1' },
        { user_id: 'user-1' },
        { user_id: 'user-1' }
      ]

      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles)

      expect(leaderboard[0].articleCount).toBe(3)
    })
  })

  describe('Points Constants', () => {
    it('should have correct point values defined', async () => {
      const { POINTS } = await import('../stores/scoring')

      expect(POINTS.ARTICLE).toBe(10)
      expect(POINTS.COMMENT_TIER_1).toBe(10)   // < 50 chars
      expect(POINTS.COMMENT_TIER_2).toBe(25)   // 50-99 chars
      expect(POINTS.COMMENT_TIER_3).toBe(50)   // 100-249 chars
      expect(POINTS.COMMENT_TIER_4).toBe(100)  // >= 250 chars
    })
  })

  describe('Comment Points', () => {
    it('should award 10 points for comments under 50 characters', async () => {
      const { calculateCommentPoints } = await import('../stores/scoring')
      
      expect(calculateCommentPoints('Short comment')).toBe(10)  // 13 chars
      expect(calculateCommentPoints('A'.repeat(49))).toBe(10)   // 49 chars
    })

    it('should award 25 points for comments between 50-99 characters', async () => {
      const { calculateCommentPoints } = await import('../stores/scoring')
      
      expect(calculateCommentPoints('A'.repeat(50))).toBe(25)   // exactly 50
      expect(calculateCommentPoints('A'.repeat(75))).toBe(25)   // middle
      expect(calculateCommentPoints('A'.repeat(99))).toBe(25)   // 99 chars
    })

    it('should award 50 points for comments between 100-249 characters', async () => {
      const { calculateCommentPoints } = await import('../stores/scoring')
      
      expect(calculateCommentPoints('A'.repeat(100))).toBe(50)  // exactly 100
      expect(calculateCommentPoints('A'.repeat(175))).toBe(50)  // middle
      expect(calculateCommentPoints('A'.repeat(249))).toBe(50)  // 249 chars
    })

    it('should award 100 points for comments 250+ characters', async () => {
      const { calculateCommentPoints } = await import('../stores/scoring')
      
      expect(calculateCommentPoints('A'.repeat(250))).toBe(100)  // exactly 250
      expect(calculateCommentPoints('A'.repeat(500))).toBe(100)  // longer
    })

    it('should return 0 for empty comments', async () => {
      const { calculateCommentPoints } = await import('../stores/scoring')
      
      expect(calculateCommentPoints('')).toBe(0)
      expect(calculateCommentPoints(null)).toBe(0)
      expect(calculateCommentPoints(undefined)).toBe(0)
    })
  })

  describe('Leaderboard with Comments', () => {
    it('should include comment points in total score', async () => {
      const users = [
        { id: 'user-1', name: 'Craig' }
      ]
      
      const articles = [
        { user_id: 'user-1' }  // 10 points
      ]
      
      const comments = [
        { user_id: 'user-1', content: 'A'.repeat(50) }  // 25 points (tier 2)
      ]

      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles, comments)

      // 10 (article) + 25 (comment) = 35 points
      expect(leaderboard[0].points).toBe(35)
    })

    it('should calculate correct points for multiple comments of different lengths', async () => {
      const users = [
        { id: 'user-1', name: 'Craig' }
      ]
      
      const articles = []
      
      const comments = [
        { user_id: 'user-1', content: 'Short' },           // 10 points (tier 1)
        { user_id: 'user-1', content: 'A'.repeat(75) },    // 25 points (tier 2)
        { user_id: 'user-1', content: 'A'.repeat(150) },   // 50 points (tier 3)
        { user_id: 'user-1', content: 'A'.repeat(300) }    // 100 points (tier 4)
      ]

      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles, comments)

      // 10 + 25 + 50 + 100 = 185 points
      expect(leaderboard[0].points).toBe(185)
      expect(leaderboard[0].commentCount).toBe(4)
    })

    it('should include comment count in leaderboard entry', async () => {
      const users = [{ id: 'user-1', name: 'Craig' }]
      const articles = []
      const comments = [
        { user_id: 'user-1', content: 'Comment 1' },
        { user_id: 'user-1', content: 'Comment 2' }
      ]

      const { calculateLeaderboard } = await import('../stores/scoring')
      const leaderboard = calculateLeaderboard(users, articles, comments)

      expect(leaderboard[0].commentCount).toBe(2)
    })
  })
})
