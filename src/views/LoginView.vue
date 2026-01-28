<template>
  <div class="login">
    <div class="login-card">
      <div class="login-icon">📰</div>
      <h1 class="login-title">Family News</h1>
      <p class="login-subtitle">Who are you?</p>
      
      <div v-if="loading" class="loading">
        Loading family members...
      </div>
      
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadUsers">Try Again</button>
      </div>
      
      <div v-else-if="users.length === 0" class="empty-message">
        <p>No family members found.</p>
        <p class="hint">Ask the admin to add users in Supabase.</p>
      </div>
      
      <div v-else class="user-list">
        <button 
          v-for="user in users" 
          :key="user.id"
          class="user-button"
          @click="selectUser(user)"
        >
          <span class="user-avatar">{{ getInitials(user.name) }}</span>
          <span class="user-name">{{ user.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '../stores/user'
import { usePushNotifications } from '../stores/pushNotifications'

const router = useRouter()
const { login, fetchUsers } = useUser()
const { isPushSupported, requestPermission, subscribeToPush } = usePushNotifications()

const users = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  loading.value = true
  error.value = null
  
  try {
    users.value = await fetchUsers()
  } catch (e) {
    error.value = 'Failed to load family members. Check your connection.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function selectUser(user) {
  login(user)
  
  // Request notification permission after login
  if (isPushSupported()) {
    const granted = await requestPermission()
    if (granted) {
      await subscribeToPush(user.id)
    }
  }
  
  router.push('/')
}

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.login-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: var(--gray-500);
  margin-bottom: 2rem;
}

.loading {
  color: var(--gray-500);
  padding: 2rem;
}

.error-message {
  color: var(--danger);
  padding: 1rem;
}

.error-message p {
  margin-bottom: 1rem;
}

.empty-message {
  color: var(--gray-500);
  padding: 1rem;
}

.hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background: var(--gray-50);
  border: 2px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.user-button:hover {
  border-color: var(--primary);
  background: white;
}

.user-avatar {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.user-name {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--gray-900);
}
</style>
