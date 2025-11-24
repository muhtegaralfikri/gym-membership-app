// src/stores/auth.ts

import { defineStore } from 'pinia'

// Tipe untuk data user (akan kita isi nanti dari GET /users/profile)
export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string | null
  isActive: boolean // <-- Kita lupakan ini
  roleId: number
  createdAt: string // <-- INI YANG HILANG (string, karena JSON)
  updatedAt: string // <-- Kita lupakan ini
}

export const useAuthStore = defineStore('auth', {
  /**
   * STATE
   * Di sinilah kita 'mengambil' token dari localStorage saat
   * aplikasi pertama kali dimuat.
   */
  state: () => ({
    token: localStorage.getItem('access_token') as string | null,
    user: null as UserProfile | null,
  }),

  /**
   * GETTERS (Computed Properties)
   * Ini adalah 'state' yang diturunkan, seperti 'isAuthenticated'
   */
  getters: {
    isAuthenticated: (state) => !!state.token,

    // Getter untuk header Authorization yang akan kita pakai di Axios/fetch
    authHeader: (state) => ({
      Authorization: `Bearer ${state.token}`,
    }),

    // Getter untuk cek role (akan berguna nanti)
    isAdmin: (state) => state.user?.roleId === 1,
    isTrainer: (state) => state.user?.roleId === 3,
  },

  /**
   * ACTIONS (Functions/Methods)
   * Ini adalah fungsi untuk mengubah state
   */
  actions: {
    /**
     * Menyimpan token setelah login sukses
     */
    setToken(newToken: string) {
      this.token = newToken
      localStorage.setItem('access_token', newToken)
    },

    /**
     * Menyimpan data user (setelah fetch profile)
     */
    setUser(newUser: UserProfile) {
      this.user = newUser
    },

    /**
     * Menghapus token dan user data saat logout
     */
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('access_token')
      
      // CATATAN:
      // Kita tidak akan redirect di sini.
      // Komponen (misal: ProfileView) yang memanggil 'logout()'
      // akan bertanggung jawab untuk me-redirect user ke /login.
      // Ini adalah pemisahan tanggung jawab (Separation of Concerns) yang lebih baik.
    },
  },
})
