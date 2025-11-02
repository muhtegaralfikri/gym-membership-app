<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
const message = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Fungsi untuk mengambil data paket (API Publik)
const fetchPackages = async () => {
  try {
    // --- 2. GANTI FETCH DENGAN API.GET ---
    // Endpoint ini publik, jadi 'api.ts' tidak akan melampirkan token
    const response = await api.get('/packages')
    packages.value = response.data
  } catch (error: any) {
    message.value =
      error.response?.data?.message || 'Gagal memuat paket.'
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
    // --- 3. GANTI FETCH DENGAN API.POST ---
    // 'api.ts' akan OTOMATIS melampirkan token JWT kita
    const response = await api.post('/transactions', { packageId })
    const data = response.data // data.paymentToken

    // Panggil Midtrans Snap
    ;(window as any).snap.pay(data.paymentToken, {
      onSuccess: function (result: any) {
        console.log('Payment Success:', result)
        message.value =
          'Pembayaran sukses! Status membership akan segera update.'
        router.push('/profile')
      },
      onPending: function (result: any) {
        console.log('Payment Pending:', result)
        message.value = 'Menunggu pembayaran Anda...'
      },
      onError: function (result: any) {
        console.error('Payment Error:', result)
        message.value = 'Pembayaran gagal.'
      },
      onClose: function () {
        message.value = 'Anda menutup jendela pembayaran sebelum selesai.'
      },
    })
    // --- BATAS PERBAIKAN ---
  } catch (error: any) {
    // --- 4. ERROR HANDLING AXIOS ---
    if (error.response) {
      if (error.response.status === 401) {
        message.value = 'Sesi Anda telah berakhir. Silakan login kembali.'
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
    <h2>Pilih Paket Membership</h2>

    <p v-if="message" class="message">{{ message }}</p>

    <p v-if="!packages.length && !message">Memuat paket...</p>

    <div class="packages-grid">
      <div v-for="pkg in packages" :key="pkg.id" class="package-card">
        <h3>{{ pkg.name }}</h3>
        <p class="price">
          Rp {{ Number(pkg.price).toLocaleString('id-ID') }}
        </p>
        <p class="duration">{{ pkg.durationDays }} Hari</p>
        <p class="description">{{ pkg.description }}</p>

        <button @click="handleBuy(pkg.id)">Beli Sekarang</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Style tidak berubah */
.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.package-card {
  border: 1px solid #555;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: left;
}
.package-card h3 {
  margin-top: 0;
}
.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b883;
}
.duration {
  font-style: italic;
  margin-top: -1rem;
}
.description {
  min-height: 50px;
}
.message {
  color: red;
}
.message:containing('sukses') {
  color: green;
}
</style>