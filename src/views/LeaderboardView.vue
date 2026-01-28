<template>
  <div class="leaderboard">
    <h2 class="section-title">🏆 Family Leaderboard</h2>
    
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
            {{ member.articleCount }} {{ member.articleCount === 1 ? 'article' : 'articles' }}
          </span>
        </div>
        <div class="leaderboard-points">
          <span class="points-value">{{ member.points }}</span>
          <span class="points-label">pts</span>
        </div>
      </div>

      <div v-if="leaderboard.length === 0" class="empty-state">
        <p>No articles have been shared yet. Be the first!</p>
      </div>

      <!-- Points breakdown -->
      <div class="points-info">
        <h3>How to earn points</h3>
        <div class="points-rule">
          <span class="points-rule-icon">📰</span>
          <span class="points-rule-text">Share an article</span>
          <span class="points-rule-value">+10 pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../stores/user'
import { calculateLeaderboard } from '../stores/scoring'

const { currentUser } = useUser()

const leaderboard = ref([])
const loading = ref(true)
const error = ref(null)

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
    
    // Fetch all articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, user_id')
    
    if (articlesError) throw articlesError
    
    // Calculate leaderboard using scoring module
    leaderboard.value = calculateLeaderboard(users, articles || [])
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
</style>
