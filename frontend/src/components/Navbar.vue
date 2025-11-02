<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login') // Arahkan ke login setelah logout
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <RouterLink to="/">VuNest GYM</RouterLink>
    </div>
    <div class="navbar-links">
      
      <RouterLink to="/packages">Lihat Paket</RouterLink>

      <template v-if="authStore.isAuthenticated">
        <RouterLink to="/profile">Profil Saya</RouterLink>
        <a @click="handleLogout" class="logout-link">Logout</a>
      </template>

      <template v-else>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/register">Register</RouterLink>
      </template>
      
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #333;
  border-bottom: 2px solid #42b883;
}

.navbar-brand a {
  font-weight: bold;
  font-size: 1.5rem;
  color: white;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  gap: 1.5rem;
}

.navbar-links a {
  color: #eee;
  text-decoration: none;
  font-weight: 500;
}

.navbar-links a:hover,
.navbar-links a.router-link-exact-active {
  color: #42b883;
}

/* Style khusus untuk tombol logout agar terlihat seperti link */
.logout-link {
  cursor: pointer;
}
</style>