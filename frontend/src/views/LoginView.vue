<script setup lang="ts">
import { ref } from 'vue'
// 1. Import hook dari router dan store
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const message = ref('')

// 2. Inisialisasi store dan router
const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  message.value = ''
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    // --- INI PERUBAHAN UTAMANYA ---
    // 3. Simpan token ke Pinia Store
    authStore.setToken(data.access_token)

    message.value = 'Login sukses! Mengalihkan ke halaman utama...'

    // 4. Redirect user ke Halaman Utama ('/') setelah 1 detik
    setTimeout(() => {
      router.push('/')
    }, 1000)
    // ---------------------------------

  } catch (error: any) {
    message.value = error.message
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