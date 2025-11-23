<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const message = ref('')
const bookingInfo = ref<{ title?: string; user?: string } | null>(null)

const submit = async () => {
  const code = route.query.code as string | undefined
  if (!code) {
    status.value = 'error'
    message.value = 'Kode check-in tidak ditemukan.'
    return
  }
  status.value = 'loading'
  try {
    const res = await api.post('/classes/checkin', { code })
    status.value = 'success'
    message.value = res.data?.message || 'Check-in berhasil.'
    bookingInfo.value = {
      title: res.data?.booking?.gymClass?.title,
      user: res.data?.booking?.user?.name,
    }
  } catch (err: any) {
    status.value = 'error'
    message.value = err?.response?.data?.message || 'Check-in gagal.'
  }
}

onMounted(submit)
</script>

<template>
  <div class="checkin-page">
    <div class="card">
      <p class="eyebrow">Check-in Kelas</p>
      <h2>Memverifikasi token...</h2>
      <p v-if="message" class="message" :class="{ success: status === 'success', error: status === 'error' }">
        {{ message }}
      </p>
      <div v-if="bookingInfo" class="details">
        <p class="muted">Kelas: <strong>{{ bookingInfo.title }}</strong></p>
        <p class="muted" v-if="bookingInfo.user">Atas nama: <strong>{{ bookingInfo.user }}</strong></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkin-page {
  min-height: 70vh;
  display: grid;
  place-items: center;
}
.card {
  width: min(460px, 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--muted);
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
.details {
  margin-top: 0.5rem;
}
</style>
