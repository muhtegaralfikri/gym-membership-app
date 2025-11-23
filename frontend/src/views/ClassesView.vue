<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface GymClass {
  id: number
  title: string
  description?: string | null
  instructor?: string | null
  location?: string | null
  startTime: string
  endTime: string
  capacity: number
  availableSlots?: number
}

type ClassStatus = 'upcoming' | 'ongoing' | 'finished'

interface ClassBooking {
  id: number
  status: string
  checkinToken?: string
  tokenExpiresIn?: number
  checkedInAt?: string | null
  gymClass: GymClass
}

const classes = ref<GymClass[]>([])
const bookings = ref<ClassBooking[]>([])
const loading = ref(true)
const bookingMessage = ref('')
const authStore = useAuthStore()
const router = useRouter()
const tokenRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)
const tokenRefreshMs = 25000

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const stopTokenRefresh = () => {
  if (tokenRefreshTimer.value) {
    clearInterval(tokenRefreshTimer.value)
    tokenRefreshTimer.value = null
  }
}

const refreshBookingTokens = async () => {
  if (!authStore.isAuthenticated) {
    stopTokenRefresh()
    return
  }
  try {
    const res = await api.get('/classes/bookings/me')
    bookings.value = res.data
  } catch {
    // silent refresh failure; keep existing tokens
  }
}

const startTokenRefresh = () => {
  stopTokenRefresh()
  if (!authStore.isAuthenticated) return
  tokenRefreshTimer.value = setInterval(() => {
    refreshBookingTokens()
  }, tokenRefreshMs)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [classRes, bookingRes] = await Promise.all([
      api.get('/classes'),
      authStore.isAuthenticated ? api.get('/classes/bookings/me') : Promise.resolve({ data: [] }),
    ])
    classes.value = classRes.data
    bookings.value = bookingRes.data
    startTokenRefresh()
  } catch {
    bookingMessage.value = 'Gagal memuat jadwal kelas.'
  } finally {
    loading.value = false
  }
}

const bookClass = async (classId: number) => {
  bookingMessage.value = ''
  if (!authStore.isAuthenticated) {
    bookingMessage.value = 'Login untuk booking kelas.'
    router.push('/login')
    return
  }
  try {
    const res = await api.post(`/classes/${classId}/book`)
    bookingMessage.value = 'Booking berhasil! QR check-in sudah dibuat.'
    // prepend newest booking
    bookings.value = [res.data, ...bookings.value.filter((b) => b.id !== res.data.id)]
    startTokenRefresh()
    classes.value = classes.value.map((cls) =>
      cls.id === classId
        ? {
            ...cls,
            availableSlots: Math.max(
              0,
              (typeof cls.availableSlots === 'number' ? cls.availableSlots : cls.capacity || 1) - 1,
            ),
          }
        : cls,
    )
  } catch (err: any) {
    bookingMessage.value = err?.response?.data?.message || 'Tidak dapat booking kelas.'
  }
}

const checkinLink = (booking: ClassBooking) =>
  booking.checkinToken
    ? `${window.location.origin}/checkin?code=${encodeURIComponent(booking.checkinToken)}`
    : ''

const checkinQr = (booking: ClassBooking) => {
  const link = checkinLink(booking)
  return link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`
    : ''
}

const decoratedClasses = computed(() => {
  const now = Date.now()
  return classes.value.map((cls) => {
    const start = new Date(cls.startTime).getTime()
    const end = new Date(cls.endTime).getTime()
    let status: ClassStatus = 'upcoming'
    if (now >= end) status = 'finished'
    else if (now >= start) status = 'ongoing'
    return { ...cls, status }
  })
})

const remainingSlots = (cls: GymClass & { status: ClassStatus }) =>
  Math.max(0, (typeof cls.availableSlots === 'number' ? cls.availableSlots : cls.capacity || 0))

const visibleClasses = computed(() => decoratedClasses.value.filter((cls) => cls.status !== 'finished'))

const statusLabel = (status: ClassStatus) => {
  if (status === 'ongoing') return 'Sedang berlangsung'
  if (status === 'finished') return 'Selesai'
  return 'Akan datang'
}

const isButtonDisabled = (cls: GymClass & { status: ClassStatus }) =>
  remainingSlots(cls) === 0

const bookingCta = (cls: GymClass & { status: ClassStatus }) =>
  remainingSlots(cls) === 0 ? 'Penuh' : 'Booking'

onMounted(fetchData)
onBeforeUnmount(stopTokenRefresh)
</script>

<template>
  <div class="classes-page">
    <header class="hero card">
      <div class="hero-copy">
        <div class="pill">Kelas & Check-in</div>
        <h2>Booking kelas, hadir, dan scan QR tanpa ribet.</h2>
        <p class="sub">
          Pilih jadwal, amankan slot, lalu tunjukkan QR check-in di resepsionis. Notifikasi mudah, kapasitas
          terpantau.
        </p>
        <div class="cta">
          <RouterLink class="solid" to="/classes">Lihat jadwal</RouterLink>
          <RouterLink class="ghost" to="/packages">Perpanjang membership</RouterLink>
        </div>
      </div>
      <div class="hero-panels">
        <div class="panel">
          <span class="label">Apa yang baru?</span>
          <strong>Booking + QR</strong>
          <small>Auto-generate kode check-in setelah booking.</small>
        </div>
        <div class="panel alt">
          <span class="label">Tip</span>
          <strong>Datang 10 menit sebelum</strong>
          <small>Tunjukkan QR di pintu untuk scan.</small>
        </div>
      </div>
    </header>

    <p v-if="bookingMessage" class="message" :class="{ success: bookingMessage.includes('berhasil') }">
      {{ bookingMessage }}
    </p>

    <div class="grid">
      <section class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Jadwal</p>
            <h3>Kelas akan datang</h3>
          </div>
        </div>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton-card" v-for="n in 3" :key="n"></div>
        </div>
        <div v-else-if="!classes.length" class="empty">Belum ada jadwal kelas.</div>
        <div v-else-if="!visibleClasses.length" class="empty">Semua jadwal sudah selesai.</div>
        <div v-else class="class-list">
          <article v-for="cls in visibleClasses" :key="cls.id" class="class-card">
            <div class="class-meta">
              <div class="class-head">
                <div>
                  <p class="eyebrow">{{ formatDateTime(cls.startTime) }}</p>
                  <h4>{{ cls.title }}</h4>
                  <p v-if="cls.description" class="muted">{{ cls.description }}</p>
                </div>
                <span class="status-badge" :class="cls.status">{{ statusLabel(cls.status) }}</span>
              </div>
              <div class="meta-row">
                <span class="badge">{{ remainingSlots(cls) }} slot</span>
                <span v-if="cls.instructor" class="pill tiny">Instruktur: {{ cls.instructor }}</span>
                <span v-if="cls.location" class="pill tiny alt">Lokasi: {{ cls.location }}</span>
              </div>
            </div>
            <div class="actions">
              <button
                v-if="cls.status === 'upcoming'"
                type="button"
                :disabled="isButtonDisabled(cls)"
                @click="bookClass(cls.id)"
                class="book-btn"
              >
                {{ bookingCta(cls) }}
              </button>
              <span v-else class="muted tiny ongoing-note">Sudah dimulai</span>
            </div>
          </article>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Booking saya</p>
            <h3>QR check-in</h3>
          </div>
        </div>
        <div v-if="!authStore.isAuthenticated" class="empty">Login untuk melihat booking.</div>
        <div v-else-if="loading" class="skeleton-grid">
          <div class="skeleton-card" v-for="n in 2" :key="n"></div>
        </div>
        <div v-else-if="!bookings.length" class="empty">Belum ada booking kelas.</div>
        <div v-else class="booking-list">
          <article v-for="bk in bookings" :key="bk.id" class="booking-card">
            <div class="booking-head">
              <div>
                <p class="eyebrow">{{ formatDateTime(bk.gymClass.startTime) }}</p>
                <h4>{{ bk.gymClass.title }}</h4>
                <p class="muted">Status: {{ bk.status }}</p>
              </div>
              <span class="badge">{{ bk.gymClass.location || 'Gym' }}</span>
            </div>
            <div class="qr-row">
              <div v-if="bk.checkinToken" class="qr-img">
                <img :src="checkinQr(bk)" alt="QR Check-in" />
              </div>
              <div v-else class="qr-placeholder">
                <span>Token belum tersedia</span>
              </div>
              <div class="qr-copy">
                <p class="muted tiny">QR dinamis, berubah tiap ~30 detik untuk mencegah screenshot reuse.</p>
                <code>{{ bk.checkinToken || 'Token tidak tersedia' }}</code>
                <a v-if="checkinLink(bk)" :href="checkinLink(bk)" target="_blank">Buka tautan check-in</a>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.classes-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
}
.hero h2 {
  margin: 0.2rem 0 0.4rem;
}
.hero .sub {
  margin-bottom: 0.6rem;
}
.hero-panels {
  display: grid;
  gap: 0.6rem;
  align-self: stretch;
}
.panel {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  background: var(--surface-alt);
}
.panel.alt {
  background: var(--primary-contrast);
}
.label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: var(--muted);
}

.cta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
}
.cta .solid,
.cta .ghost {
  border-radius: 12px;
  padding: 0.7rem 1.1rem;
  font-weight: 700;
  border: 1px solid var(--border);
}
.cta .solid {
  background: linear-gradient(120deg, var(--primary), var(--primary-alt));
  color: #fff;
}
.cta .ghost {
  background: var(--surface-alt);
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;
  align-items: start;
}
section.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.1rem 1.15rem;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}
.eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  color: var(--muted);
}
.class-list,
.booking-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.class-card,
.booking-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.class-meta {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.class-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.status-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-weight: 700;
  font-size: 0.85rem;
}
.status-badge.ongoing {
  background: #fff3cd;
  color: #b26b00;
}
.status-badge.finished {
  background: #f4f7fb;
  color: #5b6476;
}
.pill.tiny,
.pill.tiny.alt {
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  background: var(--surface-alt);
  border-radius: 999px;
}
.pill.tiny.alt {
  background: var(--primary-contrast);
}
.badge {
  background: var(--primary-contrast);
  color: var(--primary);
  border-radius: 10px;
  padding: 0.25rem 0.65rem;
  font-weight: 700;
  font-size: 0.85rem;
}
.actions {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-start;
}
.ongoing-note {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  background: var(--surface-alt);
}
.book-btn[disabled] {
  cursor: not-allowed;
  opacity: 1;
  background: #d9e2ec;
  color: #6c7687;
  border-color: #d9e2ec;
  box-shadow: none;
  transform: none;
}
.book-btn[disabled]:hover {
  opacity: 1;
  transform: none;
}
.booking-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.qr-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  margin-top: 0.75rem;
  align-items: center;
}
.qr-img img {
  width: 140px;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}
.qr-placeholder {
  width: 140px;
  height: 140px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--surface-alt);
  color: var(--muted);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 0.5rem;
}
.qr-copy {
  display: grid;
  gap: 0.35rem;
}
.qr-copy code {
  background: var(--surface-alt);
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  word-break: break-all;
}
.empty {
  padding: 1rem;
  color: var(--muted);
  background: var(--surface-alt);
  border: 1px dashed var(--border);
  border-radius: 12px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.6rem;
}
.skeleton-card {
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(90deg, var(--surface-alt), var(--surface), var(--surface-alt));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
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

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 960px) {
  .grid,
  .hero {
    grid-template-columns: 1fr;
  }
  .class-meta {
    flex-direction: column;
  }
  .tags {
    align-items: flex-start;
  }
  .qr-row {
    grid-template-columns: 1fr;
  }
  .cta {
    flex-wrap: wrap;
  }
}
</style>
