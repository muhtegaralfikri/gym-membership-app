<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
const menuOpen = ref(false)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

watch(
  () => authStore.isAuthenticated,
  () => {
    if (menuOpen.value) {
      closeMenu()
    }
  },
)
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <RouterLink to="/" @click="closeMenu">VuNest GYM</RouterLink>
    </div>
    <div class="navbar-actions">
      <button class="theme-toggle" type="button" @click="toggleTheme">
        <span v-if="isDark">🌞 Cerah</span>
        <span v-else>🌙 Gelap</span>
      </button>
      <button class="burger" type="button" @click="toggleMenu">
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
        <span :class="{ open: menuOpen }"></span>
      </button>
      <div class="navbar-links" :class="{ open: menuOpen }">
        <RouterLink to="/" @click="closeMenu">Beranda</RouterLink>
        <RouterLink to="/packages" @click="closeMenu">Lihat Paket</RouterLink>

        <template v-if="authStore.isAuthenticated">
          <RouterLink v-if="authStore.isAdmin" to="/admin" @click="closeMenu">Admin</RouterLink>
          <RouterLink to="/profile" @click="closeMenu">Profil Saya</RouterLink>
          <a @click="() => { handleLogout(); closeMenu(); }" class="logout-link">Logout</a>
        </template>

        <template v-else>
          <RouterLink to="/login" @click="closeMenu">Login</RouterLink>
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
  padding: 1rem 0;
  background: transparent;
  gap: 1rem;
}

.navbar-brand a {
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--text);
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
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

.burger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.35rem 0.45rem;
}
.burger span {
  width: 18px;
  height: 2px;
  background: var(--text);
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.burger span.open:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
.burger span.open:nth-child(2) {
  opacity: 0;
}
.burger span.open:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .navbar-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .navbar-links {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    display: none;
  }
  .navbar-links.open {
    display: flex;
  }
  .theme-toggle {
    width: auto;
  }
  .burger {
    display: inline-flex;
  }
}
</style>
