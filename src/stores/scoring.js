/**
 * Points configuration
 */
export const POINTS = {
  ARTICLE: 10
}

/**
 * Calculate score for a single user based on their activity
 */
export function calculateUserScore({ articleCount = 0 }) {
  return articleCount * POINTS.ARTICLE
}

/**
 * Calculate leaderboard with scores for all users
 * Returns array sorted by points (highest first)
 */
export function calculateLeaderboard(users, articles) {
  // Count articles per user
  const articleCounts = {}
  articles.forEach(article => {
    const userId = article.user_id
    articleCounts[userId] = (articleCounts[userId] || 0) + 1
  })

  // Calculate scores for each user
  const leaderboard = users.map(user => {
    const articleCount = articleCounts[user.id] || 0
    const points = calculateUserScore({ articleCount })

    return {
      id: user.id,
      name: user.name,
      articleCount,
      points
    }
  })

  // Sort by points descending
  leaderboard.sort((a, b) => b.points - a.points)

  return leaderboard
}
