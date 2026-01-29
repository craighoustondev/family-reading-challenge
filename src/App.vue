<template>
  <div class="app" v-if="isLoggedIn">
    <header class="header">
      <h1>📰 Family News</h1>
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
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Feed</span>
      </router-link>
      <div class="nav-item add-menu" :class="{ active: showAddMenu || $route.path === '/add' || $route.path === '/add-book' }">
        <button class="add-menu-trigger" @click="showAddMenu = !showAddMenu">
          <span class="nav-icon">➕</span>
          <span class="nav-label">Add</span>
        </button>
        <div v-if="showAddMenu" class="add-menu-dropdown">
          <router-link to="/add" class="add-menu-item" @click="showAddMenu = false">
            📰 Share Article
          </router-link>
          <router-link to="/add-book" class="add-menu-item" @click="showAddMenu = false">
            📚 Add Book
          </router-link>
        </div>
      </div>
      <router-link to="/leaderboard" class="nav-item" :class="{ active: $route.path === '/leaderboard' }">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">Scores</span>
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
const showAddMenu = ref(false)

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

/* Add menu styles */
.add-menu {
  position: relative;
}

.add-menu-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
}

.add-menu-dropdown {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  min-width: 160px;
  z-index: 1000;
}

.add-menu-item {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--gray-700);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.add-menu-item:hover {
  background: var(--gray-100);
}
</style>
