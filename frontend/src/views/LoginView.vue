<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api' // <-- 1. Import 'api' kita

const email = ref('')
const password = ref('')
const message = ref('')

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  message.value = ''
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
  }
}
</script>

<template>
  <div class="login-page">
    <h2>Login Member</h2>
    
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      
      <button type="submit">Login</button>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <p>
      Belum punya akun? <RouterLink to="/register">Daftar di sini</RouterLink>
    </p>
  </div>
</template>

<style scoped>
/* Style tidak berubah */
.login-page {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 0.75rem;
}
.message {
  margin-top: 1rem;
  color: green;
}
.message:not(:empty):not(:containing('sukses')) {
  color: red;
}
</style>