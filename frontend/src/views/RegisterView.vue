<script setup lang="ts">
import { ref } from 'vue'
// 1. Import RouterLink
import { RouterLink, useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const message = ref('')

// 2. Inisialisasi router
const router = useRouter()

const handleRegister = async () => {
  message.value = '' 
  try {
    const response = await fetch('http://localhost:3000/auth/register', {
      // ... (fetch config tidak berubah)
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }

    message.value = `Registrasi sukses! Selamat datang, ${data.name}. Mengalihkan ke login...`
    
    // 3. Redirect ke halaman login setelah sukses
    setTimeout(() => {
      router.push('/login')
    }, 1500)
    
  } catch (error: any) {
    message.value = error.message
  }
}
</script>

<template>
  <div class="register-page">
    <h2>Registrasi Member Baru</h2>
    
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="name">Nama Lengkap:</label>
        <input type="text" id="name" v-model="name" required />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password (min. 8 karakter):</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div class="form-group">
        <label for="phone">No. Telepon (Opsional):</label>
        <input type="tel" id="phone" v-model="phone" />
      </div>
      <button type="submit">Daftar</button>
    </form>

    <p v-if="message" class="message">{{ message }}</p>

    <p>
      Sudah punya akun? <RouterLink to="/login">Login di sini</RouterLink>
    </p>
  </div>
</template>

<style scoped>
/* Style tidak berubah */
.register-page {
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