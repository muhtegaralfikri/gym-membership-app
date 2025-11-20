<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const THEME_KEY = 'gym-theme'
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const theme = ref<'light' | 'dark'>(
  (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || (prefersDark ? 'dark' : 'light'),
)

const applyTheme = (mode: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', mode)
}

onMounted(() => applyTheme(theme.value))

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem(THEME_KEY, theme.value)
  applyTheme(theme.value)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login') // Arahkan ke login setelah logout
}

const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <RouterLink to="/">VuNest GYM</RouterLink>
    </div>
    <div class="navbar-actions">
      <button class="theme-toggle" type="button" @click="toggleTheme">
        <span v-if="isDark">🌞 Cerah</span>
        <span v-else>🌙 Gelap</span>
      </button>
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
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--nav);
  border: 1px solid var(--nav-border);
  border-radius: 16px;
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow);
  position: sticky;
  top: 1rem;
  z-index: 10;
  gap: 1rem;
}

.navbar-brand a {
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text);
  letter-spacing: -0.02em;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.navbar-links a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
  padding: 0.35rem 0.55rem;
  border-radius: 10px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.navbar-links a:hover,
.navbar-links a.router-link-exact-active {
  color: var(--primary);
  background-color: var(--primary-contrast);
}

.logout-link {
  cursor: pointer;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 12px;
  padding: 0.55rem 0.95rem;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  color: var(--text);
  box-shadow: none;
}

.theme-toggle:hover {
  background: var(--primary-contrast);
  color: var(--primary);
}
</style>
