import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.css'
import { useUser } from './stores/user'

// Import views
import HomeView from './views/HomeView.vue'
import AddArticleView from './views/AddArticleView.vue'
import AddBookView from './views/AddBookView.vue'
import BookDetailView from './views/BookDetailView.vue'
import LeaderboardView from './views/LeaderboardView.vue'
import LoginView from './views/LoginView.vue'

// Define routes
const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/add', name: 'add-article', component: AddArticleView, meta: { requiresAuth: true } },
  { path: '/add-book', name: 'add-book', component: AddBookView, meta: { requiresAuth: true } },
  { path: '/book/:id', name: 'book-detail', component: BookDetailView, meta: { requiresAuth: true } },
  { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Initialize user store
const { init, isLoggedIn } = useUser()
init()

// Navigation guard - redirect to login if not authenticated
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn.value) {
    next('/')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
