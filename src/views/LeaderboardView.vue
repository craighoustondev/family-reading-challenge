<template>
  <div class="leaderboard">
    <h2 class="section-title">🏆 Family Leaderboard</h2>
    
    <div v-if="loading" class="loading-state">
      Loading leaderboard...
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchLeaderboard">Try Again</button>
    </div>

    <div v-else>
      <div v-for="(member, index) in leaderboard" :key="member.id" class="leaderboard-item">
        <span 
          class="leaderboard-rank"
          :class="{ gold: index === 0, silver: index === 1, bronze: index === 2 }"
        >
          {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}
        </span>
        <span class="leaderboard-name" :class="{ 'is-me': member.id === currentUser?.id }">
          {{ member.name }}
          <span v-if="member.id === currentUser?.id" class="you-badge">(you)</span>
        </span>
        <div class="leaderboard-stats">
          <span class="leaderboard-count">{{ member.book_count }} books</span>
          <span class="leaderboard-pages">{{ member.total_pages }} pages</span>
        </div>
      </div>

      <div v-if="leaderboard.length === 0" class="empty-state">
        <p>No books have been logged yet. Be the first!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../stores/user'

const { currentUser } = useUser()

const leaderboard = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(() => {
  fetchLeaderboard()
})

async function fetchLeaderboard() {
  loading.value = true
  error.value = null
  
  try {
    // Fetch all users with their book counts
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
    
    if (usersError) throw usersError
    
    // Fetch book counts for each user
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('user_id, pages')
    
    if (booksError) throw booksError
    
    // Calculate stats for each user
    const stats = users.map(user => {
      const userBooks = books.filter(b => b.user_id === user.id)
      return {
        id: user.id,
        name: user.name,
        book_count: userBooks.length,
        total_pages: userBooks.reduce((sum, b) => sum + (b.pages || 0), 0)
      }
    })
    
    // Sort by book count (descending), then by pages (descending)
    stats.sort((a, b) => {
      if (b.book_count !== a.book_count) {
        return b.book_count - a.book_count
      }
      return b.total_pages - a.total_pages
    })
    
    leaderboard.value = stats
  } catch (e) {
    console.error('Error fetching leaderboard:', e)
    error.value = 'Failed to load leaderboard. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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

.leaderboard-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.leaderboard-count {
  font-weight: 600;
  color: var(--primary);
}

.leaderboard-pages {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.is-me {
  font-weight: 600;
}

.you-badge {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: normal;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
</style>
