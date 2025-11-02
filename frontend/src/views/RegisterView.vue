<script setup lang="ts">
import { ref } from 'vue'

// 1. 'ref' adalah cara Vue untuk membuat variabel reaktif
//    yang bisa di-update dan akan otomatis memperbarui tampilan.
const name = ref('')
const email = ref('')
const password = ref('')
const phone = ref('') // Opsional

const message = ref('') // Untuk menampilkan pesan sukses atau error

// 2. Fungsi yang akan dipanggil saat form di-submit
const handleRegister = async () => {
  // 3. Reset pesan error/sukses setiap kali submit
  message.value = '' 

  try {
    // 4. Kita panggil API backend kita
    //    Kita akan ganti 'fetch' ini dengan Axios nanti agar lebih rapi
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value || undefined, // Kirim 'undefined' jika kosong
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // 5. Tangani error dari backend (misal: "Email already exists")
      throw new Error(data.message || 'Registration failed')
    }

    // 6. Jika sukses
    message.value = `Registrasi sukses! Selamat datang, ${data.name}. Silakan login.`
    // Nanti kita akan otomatis redirect ke halaman login
    
  } catch (error: any) {
    // 7. Tampilkan pesan error di layar
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

    </div>
</template>

<style scoped>
/* Ini style sederhana, bisa kamu percantik nanti */
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
  box-sizing: border-box; /* Agar padding tidak merusak layout */
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