// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
// 1. Import PackagesView
import PackagesView from '../views/PackagesView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PackagesView, // <-- 2. Jadikan PackagesView sebagai Halaman Utama
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
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router