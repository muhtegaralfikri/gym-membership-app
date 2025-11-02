// src/stores/auth.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router' // Kita akan pakai ini untuk redirect

// 'useAuthStore' adalah nama hook kita, 'auth' adalah ID unik store
export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  // Kita ambil token dari localStorage (agar login tetap ada saat refresh)
  const token = ref(localStorage.getItem('access_token'))
  // Kita juga simpan data user (tapi belum kita isi)
  const user = ref(null)

  // --- GETTERS (Computed Properties) ---
  // Getter untuk mengecek apakah user sudah login
  const isAuthenticated = computed(() => !!token.value)
  // Getter untuk header Authorization
  const authHeader = computed(() => ({
    Authorization: `Bearer ${token.value}`,
  }))

  // --- ACTIONS (Functions) ---
  const router = useRouter()

  /**
   * Menyimpan token setelah login sukses
   */
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
  }

  /**
   * Menghapus token saat logout
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    // Arahkan ke halaman login
    router.push('/login')
  }

  // --- DATA YANG DIKEMBALIKAN ---
  return {
    token,
    user,
    isAuthenticated,
    authHeader,
    setToken,
    logout,
  }
})