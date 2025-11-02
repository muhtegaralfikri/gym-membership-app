<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth' // Kita butuh store untuk token
import { useRouter } from 'vue-router'

// Tipe data untuk paket (sesuai 'seed.ts' dan 'schema.prisma')
interface Package {
  id: number
  name: string
  description: string | null
  price: string // Prisma mengembalikan 'Decimal' sebagai 'string'
  durationDays: number
  features: string | null // Ini adalah string JSON
}

// 1. Siapkan state
const packages = ref<Package[]>([])
const message = ref('')
const authStore = useAuthStore()
const router = useRouter()

// 2. Fungsi untuk mengambil data paket (API Publik)
const fetchPackages = async () => {
  try {
    const response = await fetch('http://localhost:3000/packages') // Endpoint publik
    if (!response.ok) throw new Error('Gagal memuat paket')
    packages.value = await response.json()
  } catch (error: any) {
    message.value = error.message
  }
}

// 3. Panggil 'fetchPackages' saat komponen dimuat
onMounted(fetchPackages)

// 4. Fungsi untuk menangani pembelian (API Member)
const handleBuy = async (packageId: number) => {
  message.value = ''

  // 5. Cek apakah user sudah login (dari store)
  if (!authStore.isAuthenticated) {
    message.value = 'Anda harus login untuk membeli paket.'
    router.push('/login') // Arahkan ke login
    return
  }

  try {
    // 6. Panggil endpoint 'transactions' yang terproteksi
    const response = await fetch('http://localhost:3000/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.authHeader, // <-- Gunakan token dari Pinia!
      },
      body: JSON.stringify({ packageId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Pembuatan transaksi gagal')
    }

    // 7. INI PENTING: Kita dapat 'paymentToken' dari backend
    console.log('Payment Token:', data.paymentToken)
    message.value = 'Transaksi dibuat... Membuka jendela pembayaran.'

    // 8. TODO: Panggil Midtrans Snap.js dengan token ini
    // window.snap.pay(data.paymentToken)

  } catch (error: any) {
    message.value = error.message
    if (error.message.includes('Unauthorized')) {
      authStore.logout()
      router.push('/login')
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
  color: #42b883; /* Warna Vue */
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