/**
 * Points configuration
 */
export const POINTS = {
  ARTICLE: 10,
  COMMENT_TIER_1: 10,   // < 50 characters
  COMMENT_TIER_2: 25,   // 50-99 characters
  COMMENT_TIER_3: 50,   // 100-249 characters
  COMMENT_TIER_4: 100,  // 250+ characters
  PAGES_READ: 1,        // 1 point per page
  BOOK_COMPLETED: 100   // Bonus for completing a book
}

/**
 * Calculate points for a single comment based on its length
 */
export function calculateCommentPoints(content) {
  if (!content || content.length === 0) {
    return 0
  }

  const length = content.length

  if (length >= 250) {
    return POINTS.COMMENT_TIER_4
  } else if (length >= 100) {
    return POINTS.COMMENT_TIER_3
  } else if (length >= 50) {
    return POINTS.COMMENT_TIER_2
  } else {
    return POINTS.COMMENT_TIER_1
  }
}

/**
 * Calculate score for a single user based on their activity
 */
export function calculateUserScore({ 
  articleCount = 0, 
  comments = [], 
  pagesRead = 0, 
  booksCompleted = 0 
}) {
  const articlePoints = articleCount * POINTS.ARTICLE
  
  const commentPoints = comments.reduce((sum, comment) => {
    return sum + calculateCommentPoints(comment.content)
  }, 0)

  const pagePoints = pagesRead * POINTS.PAGES_READ
  const bookCompletionPoints = booksCompleted * POINTS.BOOK_COMPLETED

  return articlePoints + commentPoints + pagePoints + bookCompletionPoints
}

/**
 * Calculate leaderboard with scores for all users
 * Returns array sorted by points (highest first)
 */
export function calculateLeaderboard(users, articles, comments = [], books = [], readingSessions = []) {
  // Count articles per user
  const articleCounts = {}
  articles.forEach(article => {
    const userId = article.user_id
    articleCounts[userId] = (articleCounts[userId] || 0) + 1
  })

  // Group comments by user
  const userComments = {}
  comments.forEach(comment => {
    const userId = comment.user_id
    if (!userComments[userId]) {
      userComments[userId] = []
    }
    userComments[userId].push(comment)
  })

  // Count completed books per user
  const completedBooks = {}
  books.forEach(book => {
    if (book.completed) {
      const userId = book.user_id
      completedBooks[userId] = (completedBooks[userId] || 0) + 1
    }
  })

  // Sum pages read per user (from reading sessions)
  const pagesPerUser = {}
  readingSessions.forEach(session => {
    // session.books.user_id comes from the join
    const userId = session.books?.user_id
    if (userId) {
      pagesPerUser[userId] = (pagesPerUser[userId] || 0) + session.pages_read
    }
  })

  // Calculate scores for each user
  const leaderboard = users.map(user => {
    const articleCount = articleCounts[user.id] || 0
    const userCommentList = userComments[user.id] || []
    const commentCount = userCommentList.length
    const pagesRead = pagesPerUser[user.id] || 0
    const booksCompleted = completedBooks[user.id] || 0
    
    const points = calculateUserScore({ 
      articleCount, 
      comments: userCommentList,
      pagesRead,
      booksCompleted
    })

    return {
      id: user.id,
      name: user.name,
      articleCount,
      commentCount,
      pagesRead,
      booksCompleted,
      points
    }
  })

  // Sort by points descending
  leaderboard.sort((a, b) => b.points - a.points)

  return leaderboard
}
