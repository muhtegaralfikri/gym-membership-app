// src/services/api.ts

import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 1. Ambil URL dasar API kita dari environment variables
//    Vite akan otomatis memilih file .env yang tepat (dev atau prod)
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 2. Buat instance Axios
const api = axios.create({
  baseURL: VITE_API_BASE_URL,
})

// 3. Ini adalah "Interceptor" (Pencegat)
//    Fungsi ini akan berjalan SETIAP KALI kita membuat request
//    menggunakan 'api' ini.
api.interceptors.request.use(
  (config) => {
    // 4. Panggil Pinia store
    const authStore = useAuthStore()

    // 5. Jika kita sudah login (punya token)
    if (authStore.isAuthenticated) {
      // 6. Tambahkan header Authorization ke request
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    return config // Lanjutkan request
  },
  (error) => {
    // Tangani error jika ada
    return Promise.reject(error)
  },
)

// 7. Ekspor instance 'api' yang sudah dikonfigurasi
export default api