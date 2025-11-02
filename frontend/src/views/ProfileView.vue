<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore, type UserProfile } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api' // <-- 1. Import 'api' kita

// --- Tipe data baru untuk Membership ---
interface Membership {
  id: number
  startDate: string
  endDate: string
  status: 'upcoming' | 'active' | 'expired'
  package: {
    name: string
  }
}
// ------------------------------------------

const authStore = useAuthStore()
const router = useRouter()

const profile = ref<UserProfile | null>(null)
const memberships = ref<Membership[]>([])
const message = ref('')

// Fungsi untuk memformat tanggal (helper)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    message.value = 'Anda harus login untuk melihat halaman ini.'
    return
  }

  try {
    // --- 2. GANTI SEMUA FETCH DENGAN API.GET ---
    // Kita jalankan 2 request API secara paralel
    const [profileResponse, membershipResponse] = await Promise.all([
      // 'api' otomatis menambahkan base URL + header token
      api.get('/users/profile'),
      api.get('/memberships/my-status'),
    ])

    // Di Axios, data ada di 'response.data'
    const profileData: UserProfile = profileResponse.data
    profile.value = profileData
    authStore.setUser(profileData)

    const membershipData: Membership[] = membershipResponse.data
    memberships.value = membershipData

  } catch (error: any) {
    // --- 3. ERROR HANDLING AXIOS ---
    if (error.response) {
      // Jika error 401 (token expired/tidak valid), paksa logout
      if (error.response.status === 401) {
        message.value = 'Sesi Anda telah berakhir. Silakan login kembali.'
        authStore.logout()
        router.push('/login')
      } else {
        message.value =
          error.response.data.message || 'Gagal mengambil data profil.'
      }
    } else {
      message.value = 'Terjadi kesalahan jaringan.'
    }
  }
})

// Fungsi logout tidak berubah
// const handleLogout = () => {
//   authStore.logout()
//   router.push('/login')
// }
</script>

<template>
  <div class="profile-page">
    <div v-if="message" class="message">{{ message }}</div>
    <p v-if="!profile && !message">Memuat data...</p>

    <div v-if="profile" class="profile-section">
      <h2>Profil Saya</h2>
      <div class="profile-details">
        <p><strong>Nama:</strong> {{ profile.name }}</p>
        <p><strong>Email:</strong> {{ profile.email }}</p>
        <p><strong>Telepon:</strong> {{ profile.phone || '-' }}</p>
        <p>
          <strong>Terdaftar Sejak:</strong>
          {{ formatDate(profile.createdAt) }}
        </p>
      </div>
      </div>

    <div v-if="profile" class="membership-section">
      <h2>Status Membership Saya</h2>
      <div v-if="!memberships.length">
        <p>Anda belum memiliki paket membership aktif.</p>
        <RouterLink to="/packages">Beli paket sekarang</RouterLink>
      </div>
      <div v-else class="membership-list">
        <div
          v-for="mem in memberships"
          :key="mem.id"
          :class="['membership-card', mem.status]"
        >
          <h4>{{ mem.package.name }}</h4>
          <p class="status">Status: <strong>{{ mem.status }}</strong></p>
          <p>
            Berlaku hingga:
            <strong>{{ formatDate(mem.endDate) }}</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Style tidak berubah */
.profile-page {
  max-width: 800px;
  margin: 2rem auto;
}
.profile-section,
.membership-section {
  padding: 1.5rem;
  border: 1px solid #444;
  border-radius: 8px;
  margin-bottom: 2rem;
}
.profile-details p {
  text-align: left;
  line-height: 1.6;
}
.message {
  color: red;
}
.membership-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.membership-card {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #555;
  text-align: left;
}
.membership-card.active {
  border-left: 5px solid #42b883;
}
.membership-card.upcoming {
  border-left: 5px solid #ffc107;
}
.membership-card.expired {
  border-left: 5px solid #555;
  opacity: 0.7;
}
.membership-card h4 {
  margin: 0 0 0.5rem 0;
}
.membership-card p {
  margin: 0.25rem 0;
}
.status {
  text-transform: capitalize;
}
</style>