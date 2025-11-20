<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api' // <-- 1. Import 'api' kita

// Tipe data untuk paket
interface Package {
  id: number
  name: string
  description: string | null
  price: string
  durationDays: number
  features: string | null
}

const packages = ref<Package[]>([])
const loading = ref(false)
const message = ref('')
const authStore = useAuthStore()
const router = useRouter()
const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
const snapReady = ref(false)

// Parse fitur paket menjadi array
const parsedPackages = computed(() =>
  packages.value.map((pkg) => {
    let features: string[] = []
    if (pkg.features) {
      try {
        const parsed = JSON.parse(pkg.features)
        if (Array.isArray(parsed)) {
          features = parsed
        }
      } catch {
        features = [pkg.features]
      }
    }
    return { ...pkg, features }
  }),
)

// Muat script Snap sekali
const loadSnap = () =>
  new Promise<void>((resolve, reject) => {
    if (snapReady.value) return resolve()
    const existing = document.querySelector(
      'script[src="https://app.sandbox.midtrans.com/snap/snap.js"]',
    )
    if (existing) {
      snapReady.value = true
      return resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => {
      snapReady.value = true
      resolve()
    }
    script.onerror = () => reject(new Error('Gagal memuat Snap'))
    document.head.appendChild(script)
  })

// Fungsi untuk mengambil data paket (API Publik)
const fetchPackages = async () => {
  loading.value = true
  try {
    const response = await api.get('/packages')
    packages.value = response.data
  } catch (error: any) {
    message.value = error.response?.data?.message || 'Gagal memuat paket.'
  } finally {
    loading.value = false
  }
}

// Panggil 'fetchPackages' saat komponen dimuat
onMounted(fetchPackages)

// Fungsi untuk menangani pembelian (API Member)
const handleBuy = async (packageId: number) => {
  message.value = ''

  if (!authStore.isAuthenticated) {
    message.value = 'Anda harus login untuk membeli paket.'
    router.push('/login')
    return
  }

  try {
    await loadSnap()
    const response = await api.post('/transactions', { packageId })
    const data = response.data // data.paymentToken

    ;(window as any).snap.pay(data.paymentToken, {
      onSuccess: function () {
        message.value =
          'Pembayaran sukses! Status membership akan segera update.'
        router.push('/profile')
      },
      onPending: function () {
        message.value = 'Menunggu pembayaran Anda...'
      },
      onError: function () {
        message.value = 'Pembayaran gagal.'
      },
      onClose: function () {
        message.value = 'Anda menutup jendela pembayaran sebelum selesai.'
      },
    })
  } catch (error: any) {
    if (error.message === 'Gagal memuat Snap') {
      message.value = 'Gagal memuat pembayaran. Coba lagi.'
      return
    }
    if (error.response) {
      if (error.response.status === 401) {
        message.value = 'Sesi Anda berakhir. Silakan login ulang.'
        authStore.logout()
        router.push('/login')
      } else {
        message.value =
          error.response.data.message || 'Pembuatan transaksi gagal.'
      }
    } else {
      message.value = 'Terjadi kesalahan jaringan.'
    }
  }
}
</script>

<template>
  <div class="packages-page">
    <header class="hero">
      <div class="hero-copy">
        <div class="pill">Paket Membership</div>
        <h2>Latihan lebih konsisten, hasil lebih cepat.</h2>
        <p class="sub">
          Pilih paket sesuai kebutuhanmu. Aktivasi berlaku otomatis usai pembayaran, tanpa ribet.
        </p>
        <div class="hero-cta">
          <RouterLink class="solid" to="/packages">Lihat paket</RouterLink>
          <RouterLink class="ghost" to="/profile">Status saya</RouterLink>
        </div>
      </div>
      <div class="hero-art">
        <div class="glow"></div>
        <div class="metrics">
          <span class="metric-title">Rata-rata hadir</span>
          <strong>4.2x/minggu</strong>
          <small>Member aktif</small>
        </div>
        <div class="metrics alt">
          <span class="metric-title">Durasi sisa</span>
          <strong>27 hari</strong>
          <small>Langsung terukur</small>
        </div>
      </div>
    </header>

    <p v-if="message" class="message" :class="{ success: message.includes('sukses') }">
      {{ message }}
    </p>

    <div v-if="loading" class="skeleton-grid">
      <div class="skeleton-card" v-for="n in 3" :key="n"></div>
    </div>

    <div v-else class="packages-grid">
      <div v-for="pkg in parsedPackages" :key="pkg.id" class="package-card">
        <div class="card-header">
          <div>
            <h3>{{ pkg.name }}</h3>
            <p class="duration">{{ pkg.durationDays }} hari aktif</p>
          </div>
          <span class="badge">Mulai hari ini</span>
        </div>
        <p class="price">Rp {{ Number(pkg.price).toLocaleString('id-ID') }}</p>
        <p class="description">{{ pkg.description }}</p>
        <ul class="features" v-if="pkg.features?.length">
          <li v-for="feat in pkg.features" :key="feat">• {{ feat }}</li>
        </ul>
        <div class="actions">
          <button @click="handleBuy(pkg.id)">Beli Sekarang</button>
          <small>Termasuk akses kelas & locker dasar</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.packages-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.25rem;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 10%, rgba(242, 108, 45, 0.08), transparent 25%);
  pointer-events: none;
}

.hero-copy h2 {
  margin: 0.35rem 0 0.45rem;
  font-size: 2rem;
  letter-spacing: -0.02em;
}

.sub {
  color: var(--muted);
  margin: 0;
  max-width: 46ch;
}

.hero-cta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.hero-cta .solid,
.hero-cta .ghost {
  border-radius: 12px;
  padding: 0.7rem 1.1rem;
  font-weight: 700;
  border: 1px solid var(--border);
}

.hero-cta .solid {
  background: linear-gradient(120deg, var(--primary), var(--primary-alt));
  color: #fff;
}

.hero-cta .ghost {
  background: var(--surface-alt);
  color: var(--text);
}

.hero-art {
  position: relative;
  height: 100%;
  display: grid;
  gap: 0.75rem;
  justify-items: end;
}

.glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 60% 40%, rgba(15, 157, 152, 0.18), transparent 40%);
  filter: blur(18px);
  z-index: 0;
}

.metrics {
  position: relative;
  z-index: 1;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  box-shadow: var(--shadow);
}

.metrics.alt {
  background: linear-gradient(135deg, var(--primary-contrast), #fff);
}

.metric-title {
  display: block;
  font-size: 0.85rem;
  color: var(--muted);
}

.metrics strong {
  display: block;
  font-size: 1.4rem;
  margin: 0.15rem 0;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: #ffe7e7;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.message.success {
  background: #e7fff6;
  color: #0f9d98;
  border-color: #b2f5ea;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 210px;
  border-radius: 16px;
  background: linear-gradient(90deg, var(--surface-alt), var(--surface), var(--surface-alt));
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
  border: 1px solid var(--border);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.package-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: left;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.card-header h3 {
  margin: 0;
  letter-spacing: -0.01em;
}
.duration {
  margin: 0.15rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}
.badge {
  background: var(--primary-contrast);
  color: var(--primary);
  border-radius: 10px;
  padding: 0.25rem 0.65rem;
  font-weight: 700;
  font-size: 0.85rem;
}
.price {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0.25rem 0;
}
.description {
  color: var(--muted);
  min-height: 38px;
}
.features {
  list-style: none;
  padding: 0;
  margin: 0;
  color: var(--text);
}
.features li {
  margin: 0.15rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--muted);
}

button {
  align-self: flex-start;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-art {
    justify-items: start;
  }
}
</style>
