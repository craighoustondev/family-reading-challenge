import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

// Store the current user
const currentUser = ref(null)

// Check if user is logged in
const isLoggedIn = computed(() => currentUser.value !== null)

// Initialize from localStorage
function init() {
  const savedUserId = localStorage.getItem('family-reading-user-id')
  const savedUserName = localStorage.getItem('family-reading-user-name')
  
  if (savedUserId && savedUserName) {
    currentUser.value = {
      id: savedUserId,
      name: savedUserName
    }
  }
}

// Login as a user
function login(user) {
  currentUser.value = user
  localStorage.setItem('family-reading-user-id', user.id)
  localStorage.setItem('family-reading-user-name', user.name)
}

// Logout
function logout() {
  currentUser.value = null
  localStorage.removeItem('family-reading-user-id')
  localStorage.removeItem('family-reading-user-name')
}

// Fetch all users from Supabase
async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return data
}

// Export composable
export function useUser() {
  return {
    currentUser,
    isLoggedIn,
    init,
    login,
    logout,
    fetchUsers
  }
}
