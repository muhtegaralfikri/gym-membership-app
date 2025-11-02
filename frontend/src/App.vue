<script setup lang="ts">
// 1. Kita import <RouterView> dari vue-router
import { RouterView } from 'vue-router'

// 2. (Opsional) Kamu bisa tambahkan komponen Navbar/Header di sini nanti
// import Navbar from './components/Navbar.vue' 
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
/* Kita bisa hapus CSS lama dan mulai dari awal nanti */
main {
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
}
</style>