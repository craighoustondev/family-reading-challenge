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
    })
  })
})
