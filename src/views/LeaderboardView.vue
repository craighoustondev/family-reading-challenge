<template>
  <div class="leaderboard">
    <h2 class="section-title">🏆 Family Leaderboard</h2>
    
    <!-- Time Period Selector -->
    <div class="period-selector">
      <select v-model="selectedPeriod" class="period-dropdown" @change="updateLeaderboard">
        <option value="all">All Time</option>
        <option v-for="month in availableMonths" :key="month.value" :value="month.value">
          {{ month.label }}
        </option>
      </select>
    </div>

    <!-- Monthly Champion Banner -->
    <div v-if="isPastMonth && champion" class="champion-banner">
      <div class="champion-trophy">🏆</div>
      <div class="champion-info">
        <div class="champion-title">{{ selectedMonthLabel }} Champion</div>
        <div class="champion-name">{{ champion.name }}</div>
        <div class="champion-points">{{ champion.points }} points</div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading leaderboard...
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadLeaderboard">Try Again</button>
    </div>

    <div v-else>
      <div v-for="(member, index) in leaderboard" :key="member.id" class="leaderboard-item">
        <span 
          class="leaderboard-rank"
          :class="{ gold: index === 0, silver: index === 1, bronze: index === 2 }"
        >
          {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}
        </span>
        <div class="leaderboard-info">
          <span class="leaderboard-name" :class="{ 'is-me': member.id === currentUser?.id }">
            {{ member.name }}
            <span v-if="member.id === currentUser?.id" class="you-badge">(you)</span>
          </span>
          <span class="leaderboard-breakdown">
            {{ member.articleCount }} {{ member.articleCount === 1 ? 'article' : 'articles' }}, 
            {{ member.commentCount }} {{ member.commentCount === 1 ? 'comment' : 'comments' }},
            {{ member.pagesRead }} pages, 
            {{ member.booksCompleted }} {{ member.booksCompleted === 1 ? 'book' : 'books' }}
          </span>
        </div>
        <div class="leaderboard-points">
          <span class="points-value">{{ member.points }}</span>
          <span class="points-label">pts</span>
        </div>
      </div>

      <div v-if="leaderboard.length === 0 || allZeroPoints" class="empty-state">
        <p v-if="selectedPeriod === 'all'">No activity yet. Be the first to share something!</p>
        <p v-else>No activity in {{ selectedMonthLabel }}.</p>
      </div>

      <!-- Points breakdown -->
      <div class="points-info">
        <h3>How to earn points</h3>
        <div class="points-rule">
          <span class="points-rule-icon">📰</span>
          <span class="points-rule-text">Share an article</span>
          <span class="points-rule-value">+10 pts</span>
        </div>
        <div class="points-rule-header">
          <span class="points-rule-icon">💬</span>
          <span class="points-rule-text">Comment on an article</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">Under 50 characters</span>
          <span class="points-rule-value">+10 pts</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">50-99 characters</span>
          <span class="points-rule-value">+25 pts</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">100-249 characters</span>
          <span class="points-rule-value">+50 pts</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">250+ characters</span>
          <span class="points-rule-value">+100 pts</span>
        </div>
        <div class="points-rule-header">
          <span class="points-rule-icon">📚</span>
          <span class="points-rule-text">Reading books</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">Per page read</span>
          <span class="points-rule-value">+1 pt</span>
        </div>
        <div class="points-subrule">
          <span class="points-subrule-text">Complete a book</span>
          <span class="points-rule-value">+100 pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../stores/user'
import { calculateLeaderboard } from '../stores/scoring'

const { currentUser } = useUser()

const leaderboard = ref([])
const loading = ref(true)
const error = ref(null)
const selectedPeriod = ref('all')
const availableMonths = ref([])

// Store raw data for filtering
const allData = ref({
  users: [],
  articles: [],
  comments: [],
  books: [],
  readingSessions: []
})

// Check if selected period is a past month
const isPastMonth = computed(() => {
  if (selectedPeriod.value === 'all') return false
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return selectedPeriod.value < currentMonth
})

// Get champion (first place) for display
const champion = computed(() => {
  if (leaderboard.value.length > 0 && leaderboard.value[0].points > 0) {
    return leaderboard.value[0]
  }
  return null
})

// Get formatted month label
const selectedMonthLabel = computed(() => {
  if (selectedPeriod.value === 'all') return 'All Time'
  const month = availableMonths.value.find(m => m.value === selectedPeriod.value)
  return month?.label || selectedPeriod.value
})

// Check if all users have zero points
const allZeroPoints = computed(() => {
  return leaderboard.value.every(m => m.points === 0)
})

onMounted(() => {
  loadLeaderboard()
})

async function loadLeaderboard() {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
    
    if (usersError) throw usersError
    
    // Fetch all articles with timestamps
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, user_id, created_at')
    
    if (articlesError) throw articlesError
    
    // Fetch all comments with timestamps
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, user_id, content, created_at')
    
    if (commentsError) throw commentsError

    // Fetch all books with timestamps
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, user_id, completed, completed_at, created_at')
    
    if (booksError) throw booksError

    // Fetch all reading sessions with timestamps and book info
    const { data: readingSessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('id, pages_read, created_at, books(user_id)')
    
    if (sessionsError) throw sessionsError
    
    // Store raw data
    allData.value = {
      users: users || [],
      articles: articles || [],
      comments: comments || [],
      books: books || [],
      readingSessions: readingSessions || []
    }

    // Calculate available months from all data
    calculateAvailableMonths()
    
    // Update leaderboard with current filter
    updateLeaderboard()
  } catch (e) {
    console.error('Error fetching leaderboard:', e)
    error.value = 'Failed to load leaderboard. Please try again.'
  } finally {
    loading.value = false
  }
}

function calculateAvailableMonths() {
  const months = new Set()
  
  // Collect all dates from various sources
  const dates = [
    ...allData.value.articles.map(a => a.created_at),
    ...allData.value.comments.map(c => c.created_at),
    ...allData.value.books.map(b => b.created_at),
    ...allData.value.readingSessions.map(s => s.created_at)
  ].filter(Boolean)
  
  dates.forEach(dateStr => {
    const date = new Date(dateStr)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.add(monthKey)
  })
  
  // Sort months in descending order (newest first)
  const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a))
  
  // Format for display
  availableMonths.value = sortedMonths.map(monthKey => {
    const [year, month] = monthKey.split('-')
    const date = new Date(year, parseInt(month) - 1, 1)
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return { value: monthKey, label }
  })
}

function filterByMonth(items, dateField = 'created_at') {
  if (selectedPeriod.value === 'all') return items
  
  const [year, month] = selectedPeriod.value.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField])
    return itemDate >= startDate && itemDate <= endDate
  })
}

function updateLeaderboard() {
  const { users, articles, comments, books, readingSessions } = allData.value
  
  // Filter data by selected period
  const filteredArticles = filterByMonth(articles)
  const filteredComments = filterByMonth(comments)
  const filteredSessions = filterByMonth(readingSessions)
  
  // For books completed, use completed_at if available, otherwise created_at
  const filteredBooks = selectedPeriod.value === 'all' 
    ? books 
    : books.filter(book => {
        if (!book.completed) return false
        const dateField = book.completed_at || book.created_at
        if (!dateField) return false
        
        const [year, month] = selectedPeriod.value.split('-').map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)
        const bookDate = new Date(dateField)
        return bookDate >= startDate && bookDate <= endDate
      })
  
  // Calculate leaderboard using scoring module
  leaderboard.value = calculateLeaderboard(
    users,
    filteredArticles,
    filteredComments,
    filteredBooks,
    filteredSessions
  )
}
</script>

<style scoped>
.period-selector {
  margin-bottom: 1rem;
}

.period-dropdown {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  background: white;
  color: var(--gray-900);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
}

.period-dropdown:focus {
  outline: none;
  border-color: var(--primary);
}

.champion-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border: 2px solid #f59e0b;
}

.champion-trophy {
  font-size: 3rem;
}

.champion-info {
  flex: 1;
}

.champion-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.champion-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #78350f;
}

.champion-points {
  font-size: 0.875rem;
  color: #92400e;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.error-state p {
  margin-bottom: 1rem;
  color: var(--danger);
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--gray-200);
}

.leaderboard-rank {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 2.5rem;
  text-align: center;
}

.leaderboard-rank.gold { color: #fbbf24; }
.leaderboard-rank.silver { color: #9ca3af; }
.leaderboard-rank.bronze { color: #d97706; }

.leaderboard-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.leaderboard-name {
  font-weight: 500;
  color: var(--gray-900);
}

.is-me {
  font-weight: 600;
}

.you-badge {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: normal;
}

.leaderboard-breakdown {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.leaderboard-points {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.5rem;
}

.points-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.points-label {
  font-size: 0.625rem;
  color: var(--gray-500);
  text-transform: uppercase;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.points-info {
  margin-top: 2rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}

.points-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.75rem;
}

.points-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.points-rule-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
  margin-top: 0.5rem;
}

.points-rule-icon {
  font-size: 1.25rem;
}

.points-rule-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.points-rule-value {
  font-weight: 600;
  color: var(--primary);
  font-size: 0.875rem;
}

.points-subrule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0;
  padding-left: 2rem;
}

.points-subrule-text {
  flex: 1;
  font-size: 0.8rem;
  color: var(--gray-500);
}
</style>
