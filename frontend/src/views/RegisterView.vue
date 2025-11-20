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
    <div class="register-card">
      <h2>Daftar Member Baru</h2>
      <p class="sub">Mulai kelola latihan, pembayaran, dan membership di satu aplikasi.</p>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Nama Lengkap</label>
          <input type="text" id="name" v-model="name" required placeholder="Nama sesuai KTP" />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required placeholder="nama@contoh.com" />
        </div>
        <div class="form-group">
          <label for="password">Password (min. 8 karakter)</label>
          <input type="password" id="password" v-model="password" required placeholder="••••••••" />
        </div>
        <div class="form-group">
          <label for="phone">No. Telepon (Opsional)</label>
          <input type="tel" id="phone" v-model="phone" placeholder="0812xxxxxxx" />
        </div>
        <button type="submit">Daftar</button>
      </form>

      <p v-if="message" class="message">{{ message }}</p>

      <p class="redirect">
        Sudah punya akun? <RouterLink to="/login">Login di sini</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 70vh;
  display: grid;
  place-items: center;
  position: relative;
}
.register-page::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(242, 108, 45, 0.14), transparent 45%);
  filter: blur(12px);
  transform: translate(-30%, -20%);
  z-index: 0;
}
.register-card {
  width: min(520px, 100%);
  padding: 2rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
  position: relative;
  z-index: 1;
}
.register-card h2 {
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
