<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/services/api' // <-- 1. Import 'api' kita

const name = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const message = ref('')

const router = useRouter()

const handleRegister = async () => {
  message.value = ''
  try {
    // --- 2. GANTI FETCH DENGAN API.POST ---
    // Kita tidak perlu URL lengkap atau headers, 'api.ts' sudah mengaturnya.
    const response = await api.post('/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      phone: phone.value || undefined,
    })
    
    // Data sukses ada di 'response.data'
    const data = response.data 

    message.value = `Registrasi sukses! Selamat datang, ${data.name}. Mengalihkan ke login...`

    setTimeout(() => {
      router.push('/login')
    }, 1500)

  } catch (error: any) {
    // --- 3. TANGANI ERROR DARI AXIOS ---
    // Error dari backend (seperti 409 Conflict) akan ada di 'error.response.data'
    if (error.response && error.response.data) {
      message.value = error.response.data.message || 'Registrasi gagal.'
    } else {
      message.value = 'Terjadi kesalahan. Coba lagi nanti.'
    }
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
/* Style untuk error (bisa kita ubah nanti) */
.message:not(:empty):not(:containing('sukses')) {
  color: red;
}
</style>