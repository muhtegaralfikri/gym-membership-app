// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
// 1. Pastikan import ini sudah tidak error
import { useAuthStore } from '@/stores/auth' 

import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
// 2. Import ProfileView
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 3. Rute Home ('/')
    {
      path: '/',
      name: 'home',
      redirect: () => {
        const auth = useAuthStore()
        return auth.isAuthenticated ? '/profile' : '/login'
      },
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
    // 4. Rute Profile
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true } // 5. Tandai butuh login
    },
  ],
})

// 6. Global Navigation Guard
router.beforeEach((to, _from, next) => { // <-- 'from' sudah jadi '_from'
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router