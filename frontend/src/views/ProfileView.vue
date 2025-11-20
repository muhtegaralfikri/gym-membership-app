<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const initial = computed(
  () => profile.value?.name?.charAt(0).toUpperCase() ?? '?',
)

const activeMembership = computed(() => {
  const active = memberships.value.find((m) => m.status === 'active')
  return active || memberships.value[0] || null
})

// Fungsi untuk memformat tanggal (helper)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatStatus = (status: Membership['status']) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
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

    <div v-if="profile" class="hero card">
      <div class="avatar">{{ initial }}</div>
      <div class="hero-info">
        <div class="pill">Member</div>
        <h2>{{ profile.name }}</h2>
        <p class="muted">{{ profile.email }}</p>
        <div class="chips">
          <span class="chip">Telepon: {{ profile.phone || '-' }}</span>
          <span class="chip">Sejak {{ formatDate(profile.createdAt) }}</span>
          <span v-if="activeMembership" class="chip status-chip">
            Status: {{ formatStatus(activeMembership.status) }}
          </span>
        </div>
      </div>
      <div class="hero-stat">
        <p class="label">Membership aktif</p>
        <template v-if="activeMembership">
          <strong>{{ activeMembership.package.name }}</strong>
          <small>{{ formatDate(activeMembership.startDate) }} - {{ formatDate(activeMembership.endDate) }}</small>
        </template>
        <template v-else>
          <strong>Belum ada</strong>
          <small>Tambah paket untuk mulai aktif.</small>
        </template>
        <RouterLink class="ghost-btn" to="/packages">Tambah Paket</RouterLink>
      </div>
    </div>

    <div v-if="profile" class="membership-section card">
      <div class="section-head">
        <h3>Riwayat Membership</h3>
        <RouterLink class="ghost-btn" to="/packages">Lihat Paket</RouterLink>
      </div>

      <div v-if="!memberships.length" class="empty">
        <p>Anda belum memiliki paket membership aktif.</p>
        <RouterLink class="cta" to="/packages">Beli paket sekarang</RouterLink>
      </div>
      <div v-else class="membership-list">
        <div
          v-for="mem in memberships"
          :key="mem.id"
          :class="['membership-card', mem.status]"
        >
          <div class="card-top">
            <div>
              <p class="eyebrow">Paket</p>
              <h4>{{ mem.package.name }}</h4>
            </div>
            <span class="pill small">{{ mem.status }}</span>
          </div>
          <div class="dates">
            <div>
              <small>Mulai</small>
              <strong>{{ formatDate(mem.startDate) }}</strong>
            </div>
            <div>
              <small>Berakhir</small>
              <strong>{{ formatDate(mem.endDate) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 880px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  padding: 1.5rem;
  align-items: center;
}
.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--primary-contrast);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.5rem;
  border: 1px solid var(--border);
}
.hero-info h2 {
  margin: 0.15rem 0;
}
.muted {
  margin: 0;
  color: var(--muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.55rem;
}
.chip {
  padding: 0.4rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  font-weight: 600;
  color: var(--text);
}
.status-chip {
  background: var(--primary-contrast);
  color: var(--primary);
}
.hero-stat {
  justify-self: end;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.hero-stat .label {
  color: var(--muted);
  margin: 0;
}
.hero-stat strong {
  font-size: 1.2rem;
}
.ghost-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0.55rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text);
  font-weight: 700;
  gap: 0.35rem;
}
.ghost-btn:hover {
  background: var(--primary-contrast);
  color: var(--primary);
}
.membership-section {
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.message {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: #ffe7e7;
  color: #c62828;
  border: 1px solid #ffcdd2;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.section-head h3 {
  margin: 0;
}
.empty {
  background: var(--surface-alt);
  border: 1px dashed var(--border);
  padding: 1rem;
  border-radius: 12px;
}
.membership-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.membership-card {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: left;
  background: var(--surface-alt);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}
.membership-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}
.membership-card.active {
  border-left: 6px solid var(--primary);
}
.membership-card.upcoming {
  border-left: 6px solid #ffc107;
}
.membership-card.expired {
  border-left: 6px solid #555;
  opacity: 0.7;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.membership-card h4 {
  margin: 0 0 0.5rem 0;
}
.membership-card p {
  margin: 0.25rem 0;
}
.status {
  text-transform: capitalize;
  margin-bottom: 0.5rem;
}
.dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}
.dates small {
  color: var(--muted);
}
.dates strong {
  display: block;
  margin-top: 0.15rem;
}
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  background: linear-gradient(120deg, var(--primary), var(--primary-alt));
  color: #fff;
  font-weight: 700;
}
.cta:hover {
  filter: brightness(0.95);
}

.pill.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
}

@media (max-width: 780px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: left;
  }
  .hero-stat {
    justify-self: start;
    text-align: left;
  }
  .chips {
    gap: 0.35rem;
  }
}
</style>
