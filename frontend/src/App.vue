<script setup lang="ts">
// 1. Kita import <RouterView> dari vue-router
import { RouterView } from 'vue-router'

// 2. (Opsional) Kamu bisa tambahkan komponen Navbar/Header di sini nanti
import Navbar from './components/Navbar.vue' 
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <div class="page">
    <Navbar />
    <main>
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
/* Kita bisa hapus CSS lama dan mulai dari awal nanti */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  flex: 1;
}
</style>
