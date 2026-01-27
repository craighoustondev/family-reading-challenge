<template>
  <div class="app" v-if="isLoggedIn">
    <header class="header">
      <h1>📰 Family Reading Challenge</h1>
      <div class="header-user" @click="showLogoutMenu = !showLogoutMenu">
        <span class="header-avatar">{{ userInitials }}</span>
        <div v-if="showLogoutMenu" class="logout-menu">
          <div class="logout-menu-name">{{ currentUser?.name }}</div>
          <button class="logout-btn" @click.stop="handleLogout">
            Switch User
          </button>
        </div>
      </div>
    </header>
    
    <main class="main">
      <router-view />
    </main>
    
    <nav class="nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <span class="nav-icon">📰</span>
        <span class="nav-label">Articles</span>
      </router-link>
      <router-link to="/add" class="nav-item" :class="{ active: $route.path === '/add' }">
        <span class="nav-icon">➕</span>
        <span class="nav-label">Share</span>
      </router-link>
      <router-link to="/leaderboard" class="nav-item" :class="{ active: $route.path === '/leaderboard' }">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">Leaderboard</span>
      </router-link>
    </nav>
  </div>
  
  <!-- Login page - no app shell -->
  <router-view v-else />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from './stores/user'

const router = useRouter()
const { currentUser, isLoggedIn, logout } = useUser()

const showLogoutMenu = ref(false)

const userInitials = computed(() => {
  if (!currentUser.value?.name) return '?'
  return currentUser.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function handleLogout() {
  showLogoutMenu.value = false
  logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 1rem;
}

.header h1 {
  flex: 1;
}

.header-user {
  position: relative;
  cursor: pointer;
}

.header-avatar {
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.logout-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  min-width: 150px;
  z-index: 1000;
}

.logout-menu-name {
  padding: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: 0.5rem;
}

.logout-btn {
  width: 100%;
  padding: 0.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--gray-700);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.logout-btn:hover {
  background: var(--gray-100);
}
</style>
