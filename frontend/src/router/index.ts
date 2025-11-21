// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
// 1. Import PackagesView
import PackagesView from '../views/PackagesView.vue'
import HomeView from '../views/HomeView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import AdminPackagesView from '../views/AdminPackagesView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminClassesView from '../views/AdminClassesView.vue'
import AdminTransactionsView from '../views/AdminTransactionsView.vue'
import ClassesView from '../views/ClassesView.vue'
import CheckinView from '../views/CheckinView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView, // Halaman utama/beranda
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { hidden: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin-packages',
      name: 'admin-packages',
      component: AdminPackagesView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin-users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin-classes',
      name: 'admin-classes',
      component: AdminClassesView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin-transactions',
      name: 'admin-transactions',
      component: AdminTransactionsView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    // 3. (Opsional) Kita bisa tambahkan rute '/packages'
    //    jika ingin punya URL spesifik selain '/'
    {
      path: '/packages',
      name: 'packages',
      component: PackagesView,
    },
    {
      path: '/classes',
      name: 'classes',
      component: ClassesView,
    },
    {
      path: '/checkin',
      name: 'checkin',
      component: CheckinView,
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

// Global Navigation Guard (Tidak berubah)
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  try {
  if (auth.isAuthenticated && !auth.user) {
    const profileResponse = await api.get('/users/profile')
    auth.setUser(profileResponse.data)
  }
} catch (_err) {
  // handled by interceptor
}

  if (to.name === 'profile' && auth.isAdmin) {
    next({ name: 'admin' })
    return
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    next({ name: auth.isAuthenticated ? 'home' : 'login' })
    return
  }

  next()
})

export default router
