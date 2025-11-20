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
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    // 3. (Opsional) Kita bisa tambahkan rute '/packages'
    //    jika ingin punya URL spesifik selain '/'
    {
      path: '/packages',
      name: 'packages',
      component: PackagesView,
    },
  ],
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

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  next()
})

export default router
