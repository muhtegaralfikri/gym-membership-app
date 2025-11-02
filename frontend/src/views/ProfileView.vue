<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore, type UserProfile } from '@/stores/auth' // <-- 1. Import tipenya
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// 2. Gunakan tipe UserProfile yang sudah diimpor
const profile = ref<UserProfile | null>(null)
const message = ref('')

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    message.value = 'Anda harus login untuk melihat halaman ini.'
    return
  }

  try {
    const response = await fetch('http://localhost:3000/users/profile', {
      method: 'GET',
      headers: {
        ...authStore.authHeader,
      },
    })

    // 3. Kita beri tahu TypeScript bahwa 'data' adalah UserProfile
    const data: UserProfile = await response.json()

    if (!response.ok) {
      // Kita ganti dengan 'any' cast yang lebih aman di sini
      throw new Error((data as any).message || 'Gagal mengambil profil')
    }

    profile.value = data
    authStore.setUser(data) // Simpan di state global
  } catch (error: any) {
    message.value = error.message
    if (error.message.includes('Unauthorized')) {
      authStore.logout()
      router.push('/login')
    }
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile-page">
    <h2>Profil Saya</h2>
    <div v-if="profile" class="profile-details">
      <p><strong>Nama:</strong> {{ profile.name }}</p>
      <p><strong>Email:</strong> {{ profile.email }}</p>
      <p><strong>Telepon:</strong> {{ profile.phone || '-' }}</p>
      <p>
        <strong>Terdaftar Sejak:</strong>
        {{ new Date(profile.createdAt).toLocaleDateString('id-ID') }}
      </p>
    </div>
    <p v-if="!profile && !message">Memuat profil...</p>
    <p v-if="message" class_name="message">{{ message }}</p>
    <button
      v-if="authStore.isAuthenticated"
      @click="handleLogout"
      class="logout-button"
    >
      Logout
    </button>
  </div>
</template>

<style scoped>
/* Style tidak berubah */
.profile-page {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.profile-details p {
  text-align: left;
  line-height: 1.6;
}
.message {
  color: red;
}
.logout-button {
  margin-top: 1rem;
  background-color: #ff4d4d;
  color: white;
  width: auto;
}
</style>