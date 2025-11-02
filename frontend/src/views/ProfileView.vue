<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore, type UserProfile } from '@/stores/auth'
import { useRouter } from 'vue-router'

// --- 1. Tipe data baru untuk Membership ---
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
// --- 2. State baru untuk memberships ---
const memberships = ref<Membership[]>([])
// -------------------------------------
const message = ref('')

// Fungsi untuk memformat tanggal (helper)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// onMounted akan memuat data profil DAN membership
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    message.value = 'Anda harus login untuk melihat halaman ini.'
    return
  }

  try {
    // --- 3. Kita jalankan 2 fetch secara paralel ---
    const [profileResponse, membershipResponse] = await Promise.all([
      // Panggilan pertama: ambil profil
      fetch('http://localhost:3000/users/profile', {
        method: 'GET',
        headers: { ...authStore.authHeader },
      }),
      // Panggilan kedua: ambil status membership
      fetch('http://localhost:3000/memberships/my-status', {
        method: 'GET',
        headers: { ...authStore.authHeader },
      }),
    ])
    // -------------------------------------------

    // Proses data profil
    if (!profileResponse.ok) throw new Error('Gagal mengambil profil')
    const profileData: UserProfile = await profileResponse.json()
    profile.value = profileData
    authStore.setUser(profileData)

    // Proses data membership
    if (!membershipResponse.ok) throw new Error('Gagal mengambil status membership')
    const membershipData: Membership[] = await membershipResponse.json()
    memberships.value = membershipData

  } catch (error: any) {
    message.value = error.message
    if (error.message.includes('Unauthorized')) {
      authStore.logout()
      router.push('/login')
    }
  }
})

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
      <!-- <button @click="handleLogout" class="logout-button">
        Logout
      </button> -->
    </div>

    <div v-if="profile" class="membership-section">
      <h2>Status Membership Saya</h2>
      
      <div v-if="!memberships.length">
        <p>Anda belum memiliki paket membership aktif.</p>
        <a href="/">Beli paket sekarang</a>
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

.logout-button {
  margin-top: 1rem;
  background-color: #ff4d4d;
  color: white;
  width: auto;
  float: right;
}

/* Style untuk card membership */
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
  border-left: 5px solid #42b883; /* Hijau (Aktif) */
}
.membership-card.upcoming {
  border-left: 5px solid #ffc107; /* Kuning (Upcoming) */
}
.membership-card.expired {
  border-left: 5px solid #555; /* Abu-abu (Expired) */
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