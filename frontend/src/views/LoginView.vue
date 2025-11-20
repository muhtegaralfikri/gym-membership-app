<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api' // <-- 1. Import 'api' kita

const email = ref('')
const password = ref('')
const message = ref('')
const loading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  message.value = ''
  loading.value = true
  try {
    // --- 2. GANTI FETCH DENGAN API.POST ---
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    const data = response.data // data.access_token

    // 3. Simpan token ke Pinia Store
    authStore.setToken(data.access_token)

    message.value = 'Login sukses! Mengalihkan...'

    // 4. Redirect user ke Halaman Profil
    // Kita gunakan 'replace' agar user tidak bisa klik "back" ke halaman login
    setTimeout(() => {
      router.replace('/profile')
    }, 1000)

  } catch (error: any) {
    // --- 5. TANGANI ERROR DARI AXIOS ---
    if (error.response && error.response.data) {
      // (Misal: 401 Unauthorized, 404 Not Found)
      message.value = error.response.data.message || 'Login gagal.'
    } else {
      message.value = 'Terjadi kesalahan jaringan. Coba lagi nanti.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2>Masuk ke VuNest Gym</h2>
      <p class="sub">Akses jadwal, status membership, dan pembayaran dalam satu tempat.</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required placeholder="nama@contoh.com" />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required placeholder="••••••••" />
        </div>
        
      <button type="submit" :disabled="loading">
        <span v-if="loading">Memproses...</span>
        <span v-else>Login</span>
      </button>
      </form>

      <p v-if="message" class="message">{{ message }}</p>

      <p class="redirect">
        Belum punya akun? <RouterLink to="/register">Daftar di sini</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 70vh;
  display: grid;
  place-items: center;
  position: relative;
}
.login-page::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(15, 157, 152, 0.14), transparent 45%);
  filter: blur(12px);
  transform: translate(-40%, -30%);
  z-index: 0;
}
.login-card {
  width: min(460px, 100%);
  padding: 2rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
  position: relative;
  z-index: 1;
}
.login-card h2 {
  margin: 0 0 0.35rem;
  letter-spacing: -0.01em;
}
.sub {
  margin: 0 0 1.25rem;
  color: var(--muted);
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 600;
}
.form-group input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
}
button {
  width: 100%;
  padding: 0.9rem;
}
button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: var(--primary-contrast);
  color: var(--text);
}
.message:not(:empty):not(:containing('sukses')) {
  background: #ffe7e7;
  color: #c62828;
}
.redirect {
  margin-top: 1.25rem;
}
.redirect a {
  color: var(--primary);
}
</style>
