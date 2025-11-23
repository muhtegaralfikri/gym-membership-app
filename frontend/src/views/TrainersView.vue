<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface TrainerProfile {
  specialties: string
  bio: string
  rate?: string | number | null
  rating?: number | null
}

interface Trainer {
  id: number
  name: string
  email?: string | null
  trainerProfile?: TrainerProfile & { availabilities?: Array<{ dayOfWeek: number; startTime: string; endTime: string }> }
}

interface SlotResponse {
  slots: string[]
}

interface MemberSession {
  id: number
  scheduledAt: string
  durationMinutes: number
  status: string
  notes?: string | null
  trainer: {
    id: number
    name: string
    trainerProfile?: TrainerProfile | null
  }
}

const authStore = useAuthStore()
const router = useRouter()

const trainers = ref<Trainer[]>([])
const loadingTrainers = ref(false)
const trainersError = ref('')

const modalOpen = ref(false)
const selectedTrainer = ref<Trainer | null>(null)
const selectedDate = ref('')
const slots = ref<string[]>([])
const loadingSlots = ref(false)
const slotError = ref('')
const selectedSlot = ref<string | null>(null)

const bookingMessage = ref('')
const bookingError = ref('')
const bookingLoading = ref(false)

const mySessions = ref<MemberSession[]>([])
const loadingSessions = ref(false)
const sessionsError = ref('')

const todayStr = () => new Date().toISOString().slice(0, 10)

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const formattedRate = (trainer: Trainer) => {
  const rate = trainer.trainerProfile?.rate
  if (rate === undefined || rate === null) return 'Termasuk paket'
  const numeric = typeof rate === 'string' ? parseFloat(rate) : rate
  if (Number.isNaN(numeric)) return 'Termasuk paket'
  return `+ Rp ${numeric.toLocaleString('id-ID')}`
}

const openModal = (trainer: Trainer) => {
  selectedTrainer.value = trainer
  modalOpen.value = true
  selectedDate.value = todayStr()
  slots.value = []
  selectedSlot.value = null
  slotError.value = ''
  bookingMessage.value = ''
  bookingError.value = ''
  void fetchSlots()
}

const closeModal = () => {
  modalOpen.value = false
  selectedTrainer.value = null
  selectedSlot.value = null
  slots.value = []
}

watch(selectedDate, (val) => {
  if (modalOpen.value && selectedTrainer.value && val) {
    void fetchSlots()
  }
})

const fetchTrainers = async () => {
  loadingTrainers.value = true
  trainersError.value = ''
  try {
    const res = await api.get<Trainer[]>('/trainers')
    trainers.value = res.data
  } catch (err: any) {
    trainersError.value = err?.response?.data?.message || 'Gagal memuat daftar trainer.'
  } finally {
    loadingTrainers.value = false
  }
}

const fetchSlots = async () => {
  if (!selectedTrainer.value || !selectedDate.value) return
  loadingSlots.value = true
  slotError.value = ''
  selectedSlot.value = null
  try {
    const res = await api.get<SlotResponse>(`/trainers/${selectedTrainer.value.id}/slots`, {
      params: { date: selectedDate.value },
    })
    slots.value = res.data?.slots || []
  } catch (err: any) {
    slotError.value = err?.response?.data?.message || 'Tidak dapat memuat slot.'
    slots.value = []
  } finally {
    loadingSlots.value = false
  }
}

const fetchSessions = async () => {
  if (!authStore.isAuthenticated) {
    mySessions.value = []
    return
  }
  loadingSessions.value = true
  sessionsError.value = ''
  try {
    const res = await api.get<MemberSession[]>('/trainers/sessions/me')
    mySessions.value = res.data || []
  } catch (err: any) {
    sessionsError.value = err?.response?.data?.message || 'Gagal memuat sesi Anda.'
  } finally {
    loadingSessions.value = false
  }
}

const bookSession = async () => {
  bookingMessage.value = ''
  bookingError.value = ''
  if (!selectedSlot.value) {
    bookingError.value = 'Pilih waktu terlebih dahulu.'
    return
  }
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  bookingLoading.value = true
  try {
    await api.post(`/trainers/${selectedTrainer.value?.id}/book`, {
      scheduledAt: selectedSlot.value,
    })
    bookingMessage.value = 'Booking sesi PT berhasil!'
    await fetchSessions()
  } catch (err: any) {
    bookingError.value = err?.response?.data?.message || 'Booking gagal.'
  } finally {
    bookingLoading.value = false
  }
}

const hasSessions = computed(() => mySessions.value.length > 0)

onMounted(() => {
  void fetchTrainers()
  void fetchSessions()
})
</script>

<template>
  <div class="trainers-page">
    <header class="hero card">
      <div class="hero-copy">
        <div class="pill">Personal Trainer</div>
        <h2>Booking sesi privat, pilih slot, dan pantau jadwal Anda.</h2>
        <p class="sub">
          Lihat profil trainer, cek ketersediaan harian, dan amankan jadwal PT sesuai paket Anda.
        </p>
        <div class="cta">
          <button class="solid" type="button" @click="fetchTrainers" :disabled="loadingTrainers">
            {{ loadingTrainers ? 'Muat...' : 'Segarkan daftar trainer' }}
          </button>
        </div>
      </div>
      <div class="hero-panels">
        <div class="panel">
          <span class="label">Cepat</span>
          <strong>Pilih slot, klik booking</strong>
          <small>Notifikasi langsung ke email.</small>
        </div>
        <div class="panel alt">
          <span class="label">Kontrol</span>
          <strong>Lihat sesi saya</strong>
          <small>Pantau jadwal PT mendatang.</small>
        </div>
      </div>
    </header>

    <div class="layout">
      <section class="card trainer-list">
        <div class="section-head">
          <div>
            <p class="eyebrow">Trainer</p>
            <h3>Pilih trainer favorit</h3>
          </div>
        </div>

        <p v-if="trainersError" class="message error">{{ trainersError }}</p>
        <div v-else-if="loadingTrainers" class="skeleton-grid">
          <div class="skeleton-card" v-for="n in 3" :key="n"></div>
        </div>
        <div v-else-if="!trainers.length" class="empty">Belum ada trainer yang terdaftar.</div>
        <div v-else class="trainer-grid">
          <article
            v-for="trainer in trainers"
            :key="trainer.id"
            class="trainer-card"
            @click="openModal(trainer)"
          >
            <div class="avatar">{{ initials(trainer.name) }}</div>
            <div class="trainer-info">
              <div class="header">
                <h4>{{ trainer.name }}</h4>
                <span class="rating">
                  ⭐ {{ trainer.trainerProfile?.rating ?? 5 }}
                </span>
              </div>
              <p class="specialties">
                {{ trainer.trainerProfile?.specialties || 'Belum ada spesialisasi' }}
              </p>
              <p class="bio">{{ trainer.trainerProfile?.bio }}</p>
              <div class="meta">
                <span class="rate">{{ formattedRate(trainer) }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="card my-sessions">
        <div class="section-head">
          <div>
            <p class="eyebrow">Sesi saya</p>
            <h3>PT mendatang</h3>
          </div>
          <button type="button" class="ghost" @click="fetchSessions" :disabled="loadingSessions">
            {{ loadingSessions ? 'Memuat...' : 'Segarkan' }}
          </button>
        </div>

        <p v-if="sessionsError" class="message error">{{ sessionsError }}</p>
        <p v-else-if="!authStore.isAuthenticated" class="empty">Login untuk melihat sesi Anda.</p>
        <div v-else-if="loadingSessions" class="skeleton-grid narrow">
          <div class="skeleton-line" v-for="n in 3" :key="n"></div>
        </div>
        <div v-else-if="!hasSessions" class="empty">Belum ada sesi terjadwal.</div>
        <div v-else class="sessions-list">
          <article v-for="session in mySessions" :key="session.id" class="session-card">
            <div>
              <p class="eyebrow">{{ formatDateTime(session.scheduledAt) }}</p>
              <h4>{{ session.trainer?.name }}</h4>
              <p class="muted">
                Durasi {{ session.durationMinutes }} menit — {{ session.status }}
              </p>
              <p v-if="session.notes" class="notes">{{ session.notes }}</p>
            </div>
            <div class="badge">{{ session.trainer?.trainerProfile?.specialties || 'PT' }}</div>
          </article>
        </div>
      </section>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal card">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Booking PT</p>
            <h3>{{ selectedTrainer?.name }}</h3>
            <p class="muted">{{ selectedTrainer?.trainerProfile?.specialties }}</p>
          </div>
          <button type="button" class="ghost" @click="closeModal">Tutup</button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span>Tanggal</span>
            <input v-model="selectedDate" type="date" />
          </label>

          <div class="slots">
            <div class="slots-head">
              <h4>Slot tersedia</h4>
              <small v-if="loadingSlots">Memuat slot...</small>
            </div>
            <p v-if="slotError" class="message error">{{ slotError }}</p>
            <div v-else-if="loadingSlots" class="skeleton-grid narrow">
              <div class="skeleton-line" v-for="n in 4" :key="n"></div>
            </div>
            <div v-else-if="!slots.length" class="empty">Tidak ada slot pada tanggal ini.</div>
            <div v-else class="slots-grid">
              <button
                v-for="slot in slots"
                :key="slot"
                type="button"
                :class="{ ghost: selectedSlot !== slot, selected: selectedSlot === slot }"
                @click="selectedSlot = slot"
              >
                {{ formatTime(slot) }}
              </button>
            </div>
          </div>
        </div>

        <footer class="modal-foot">
          <div class="messages">
            <p v-if="bookingMessage" class="message success">{{ bookingMessage }}</p>
            <p v-if="bookingError" class="message error">{{ bookingError }}</p>
          </div>
          <button type="button" @click="bookSession" :disabled="bookingLoading">
            {{ bookingLoading ? 'Memproses...' : 'Book Session' }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trainers-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.hero-copy h2 {
  margin: 0.35rem 0;
  font-size: 1.7rem;
  letter-spacing: -0.01em;
}

.hero .sub {
  color: var(--muted);
  margin: 0;
  max-width: 520px;
}

.cta {
  margin-top: 0.6rem;
  display: flex;
  gap: 0.6rem;
}

.hero-panels {
  display: grid;
  gap: 0.75rem;
}

.panel {
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
}

.panel.alt {
  background: var(--primary-contrast);
}

.panel .label {
  color: var(--muted);
  font-size: 0.85rem;
}

.panel strong {
  display: block;
  margin: 0.2rem 0;
  font-size: 1.05rem;
}

.panel small {
  color: var(--muted);
}

.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.trainer-list,
.my-sessions {
  padding: 1.25rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.trainer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
}

.trainer-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.trainer-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--primary-contrast);
  color: var(--primary);
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
}

.trainer-info h4 {
  margin: 0;
}

.trainer-info .header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.specialties {
  margin: 0.1rem 0;
  color: var(--muted);
  font-weight: 600;
}

.bio {
  margin: 0.2rem 0 0.3rem;
  color: var(--muted);
  font-size: 0.95rem;
}

.meta {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.3rem;
}

.rate {
  padding: 0.25rem 0.6rem;
  border-radius: 10px;
  background: var(--primary-contrast);
  color: var(--primary);
  border: 1px solid var(--border);
  font-weight: 700;
}

.rating {
  font-size: 0.95rem;
  color: #f6b73c;
}

.my-sessions .sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.8rem;
}

.session-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}

.session-card .badge {
  background: var(--surface-alt);
  border-radius: 10px;
  padding: 0.4rem 0.7rem;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid var(--border);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
}

.empty {
  margin: 1rem 0;
  color: var(--muted);
}

.message {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  margin: 0.5rem 0;
}

.message.success {
  background: #ecfdf3;
  color: #065f46;
  border: 1px solid #bbf7d0;
}

.message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.muted {
  color: var(--muted);
  margin: 0.25rem 0;
}

.notes {
  color: var(--text);
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.field input {
  padding: 0.65rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 1rem;
}

.slots {
  margin-top: 0.5rem;
}

.slots-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.slots-grid button {
  width: 100%;
}

button.ghost {
  background: transparent;
  color: var(--text);
  box-shadow: none;
}

button.selected {
  background: linear-gradient(120deg, var(--primary), var(--accent-hover));
  color: #fff;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 26, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 100;
}

.modal {
  max-width: 640px;
  width: 100%;
  padding: 1rem;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.modal-body {
  margin: 1rem 0;
}

.modal-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.skeleton-card,
.skeleton-line {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 12px;
  height: 90px;
  animation: pulse 1.2s ease-in-out infinite;
}

.skeleton-line {
  height: 16px;
}

.skeleton-grid.narrow {
  grid-template-columns: 1fr;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
