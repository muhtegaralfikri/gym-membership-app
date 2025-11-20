import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // <-- 1. Import 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // --- TAMBAHKAN BLOK INI ---
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Jangan hapus isi folder dist (mis. file .user.ini yang diset server)
    emptyOutDir: false,
  },
  // --- BATAS TAMBAHAN ---
})
