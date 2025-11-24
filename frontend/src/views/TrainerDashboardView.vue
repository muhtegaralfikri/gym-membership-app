<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface TrainerSession {
  id: number
  scheduledAt: string
  durationMinutes: number
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NOSHOW' | string
  notes?: string | null
  member?: {
    id: number
    name: string
    email?: string | null
  } | null
}

const auth = useAuthStore()
const router = useRouter()

const sessions = ref<TrainerSession[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const completing = ref(false)
const selectedSessionId = ref<number | null>(null)
const notesInput = ref('')

const fetchSessions = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<TrainerSession[]>('/trainer/sessions')
    sessions.value = res.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat jadwal trainer.'
  } finally {
    loading.value = false
  }
}

const groupedSessions = computed(() => {
  const grouped: Record<string, TrainerSession[]> = {}
  const sorted = [...sessions.value].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  sorted.forEach((session) => {
    if (session.status === 'CANCELLED') return
    const key = session.scheduledAt.slice(0, 10)
    grouped[key] = grouped[key] ? [...grouped[key], session] : [session]
  })

  return Object.entries(grouped)
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatDate(dateKey),
      items,
    }))
    .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime())
})

const upcomingSessions = computed(() =>
  sessions.value
    .filter(
      (s) =>
        s.status !== 'CANCELLED' &&
        new Date(s.scheduledAt).getTime() >= Date.now() &&
        s.status !== 'COMPLETED',
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
)

const completedSessions = computed(() =>
  sessions.value
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
)

const needsAction = computed(() =>
  sessions.value.filter(
    (s) =>
      s.status !== 'CANCELLED' &&
      s.status !== 'COMPLETED' &&
      new Date(s.scheduledAt).getTime() < Date.now(),
  ),
)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

const formatTimeRange = (session: TrainerSession) => {
  const start = new Date(session.scheduledAt)
  const end = new Date(start.getTime() + (session.durationMinutes || 60) * 60000)
  return `${start.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

const startComplete = (session: TrainerSession) => {
  selectedSessionId.value = session.id
  notesInput.value = session.notes || ''
  success.value = ''
  error.value = ''
}

const closeSheet = () => {
  selectedSessionId.value = null
  notesInput.value = ''
}

const submitCompletion = async () => {
  if (!selectedSessionId.value) return
  completing.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post(`/trainer/sessions/${selectedSessionId.value}/complete`, {
      notes: notesInput.value || undefined,
    })
    sessions.value = sessions.value.map((s) =>
      s.id === selectedSessionId.value
        ? { ...s, status: 'COMPLETED', notes: notesInput.value }
        : s,
    )
    success.value = 'Sesi ditandai selesai dan catatan tersimpan.'
    closeSheet()
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal menandai sesi.'
  } finally {
    completing.value = false
  }
}

const statusBadge = (status: TrainerSession['status']) => {
  switch (status) {
    case 'BOOKED':
      return 'booked'
    case 'COMPLETED':
      return 'completed'
    case 'NOSHOW':
      return 'noshow'
    default:
      return 'muted'
  }
}

onMounted(() => {
  if (!auth.isTrainer && !auth.isAdmin) {
    router.replace({ name: 'home' })
    return
  }
  void fetchSessions()
})
</script>

<template>
  <div class="trainer-page">
    <header class="hero card">
      <div>
        <div class="pill">Dashboard Trainer</div>
        <h1>Halo {{ auth.user?.name || 'Trainer' }}, jadwalkan dan catat sesi Anda.</h1>
        <p class="sub">
          Lihat agenda pribadi, tandai sesi selesai, dan simpan catatan latihan sebagai jurnal
          member.
        </p>
        <div class="hero-actions">
          <button type="button" @click="fetchSessions" :disabled="loading">
            {{ loading ? 'Memuat...' : 'Segarkan jadwal' }}
          </button>
          <span v-if="success" class="inline-message success">{{ success }}</span>
          <span v-if="error" class="inline-message error">{{ error }}</span>
        </div>
      </div>
      <div class="hero-meta">
        <div class="pill soft">Status Anda: Trainer</div>
        <div class="meta-grid">
          <div class="meta-card">
            <p class="label">Sesi akan datang</p>
            <strong>{{ upcomingSessions.length }}</strong>
            <small>Terjadwal setelah hari ini</small>
          </div>
          <div class="meta-card">
            <p class="label">Catatan tersimpan</p>
            <strong>{{ completedSessions.length }}</strong>
            <small>Sesi selesai dengan jurnal</small>
          </div>
          <div class="meta-card">
            <p class="label">Butuh aksi</p>
            <strong>{{ needsAction.length }}</strong>
            <small>Lewat jadwal, belum diselesaikan</small>
          </div>
        </div>
      </div>
    </header>

    <section class="card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Kalender</p>
          <h3>Agenda personal</h3>
          <p class="muted helper">
            Klik satu sesi untuk menandai selesai dan menulis catatan latihan.
          </p>
        </div>
        <button type="button" class="ghost" @click="fetchSessions" :disabled="loading">
          {{ loading ? 'Memuat...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="loading" class="skeleton-grid">
        <div class="skeleton-card" v-for="n in 3" :key="n"></div>
      </div>
      <p v-else-if="!groupedSessions.length" class="empty">Belum ada sesi di kalender.</p>
      <div v-else class="calendar-grid">
        <div v-for="day in groupedSessions" :key="day.dateKey" class="day-column">
          <div class="day-head">
            <p class="eyebrow">{{ day.label }}</p>
            <span class="pill light">{{ day.items.length }} sesi</span>
          </div>
          <div class="session-card" v-for="session in day.items" :key="session.id">
            <div class="session-meta">
              <p class="time">{{ formatTimeRange(session) }}</p>
              <h4>{{ session.member?.name || 'Member' }}</h4>
              <p class="muted">{{ session.member?.email }}</p>
              <p v-if="session.notes" class="notes">Catatan: {{ session.notes }}</p>
            </div>
            <div class="session-actions">
              <span :class="['badge', statusBadge(session.status)]">{{ session.status }}</span>
              <button
                v-if="session.status !== 'COMPLETED'"
                type="button"
                class="ghost"
                @click="startComplete(session)"
              >
                Selesai + catatan
              </button>
              <span v-else class="muted small">Sudah selesai</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card journal" v-if="completedSessions.length">
      <div class="section-head">
        <div>
          <p class="eyebrow">Log latihan</p>
          <h3>Catatan terkini</h3>
        </div>
      </div>
      <div class="journal-grid">
        <article v-for="session in completedSessions.slice(0, 6)" :key="session.id" class="journal-card">
          <p class="eyebrow">{{ formatDate(session.scheduledAt) }}</p>
          <h4>{{ session.member?.name || 'Member' }}</h4>
          <p class="muted">{{ formatTimeRange(session) }}</p>
          <p class="notes">{{ session.notes || 'Tidak ada catatan' }}</p>
        </article>
      </div>
    </section>

    <div v-if="selectedSessionId" class="sheet-backdrop" @click.self="closeSheet">
      <div class="sheet">
        <div class="sheet-head">
          <div>
            <p class="eyebrow">Tandai selesai</p>
            <h3>Catatan latihan</h3>
          </div>
          <button type="button" class="ghost" @click="closeSheet">Tutup</button>
        </div>
        <label class="field">
          <span>Catatan</span>
          <textarea
            v-model="notesInput"
            rows="4"
            placeholder="Contoh: Hari ini Budi latihan Deadlift 60kg."
          ></textarea>
        </label>
        <div class="sheet-actions">
          <button type="button" @click="submitCompletion" :disabled="completing">
            {{ completing ? 'Menyimpan...' : 'Simpan & tandai selesai' }}
          </button>
          <button type="button" class="ghost" @click="closeSheet">Batal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trainer-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
  padding: 1.5rem;
  background: radial-gradient(circle at 20% 20%, rgba(26, 131, 144, 0.12), transparent 30%),
    radial-gradient(circle at 80% 0%, rgba(107, 33, 168, 0.12), transparent 26%),
    var(--surface);
  position: relative;
  overflow: hidden;
}

.hero h1 {
  margin: 0.3rem 0 0.4rem;
  letter-spacing: -0.01em;
}

.sub {
  margin: 0;
  color: var(--muted);
  max-width: 52ch;
}

.hero-actions {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.inline-message {
  padding: 0.45rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.inline-message.success {
  background: #ecfdf3;
  color: #065f46;
}

.inline-message.error {
  background: #fef2f2;
  color: #991b1b;
}

.hero-meta {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  background: var(--surface-alt);
  align-self: flex-start;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: var(--primary-contrast);
  color: var(--primary);
  border: 1px solid var(--border);
  font-weight: 700;
}

.pill.soft {
  background: var(--surface);
}

.pill.light {
  background: var(--surface-alt);
  color: var(--text);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.6rem;
  margin-top: 0.8rem;
}

.meta-card {
  padding: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.meta-card .label {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.helper {
  margin: 0.25rem 0 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.8rem;
  margin-top: 0.75rem;
}

.day-column {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--surface-alt);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  background: var(--surface);
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
}

.session-meta h4 {
  margin: 0.1rem 0;
}

.session-meta .time {
  margin: 0;
  font-weight: 700;
}

.session-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.badge {
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  font-weight: 700;
  border: 1px solid var(--border);
}

.badge.booked {
  background: #ecf2ff;
  color: #1d4ed8;
}

.badge.completed {
  background: #ecfdf3;
  color: #166534;
}

.badge.noshow {
  background: #fff7ed;
  color: #b45309;
}

.notes {
  margin: 0.35rem 0 0;
  color: var(--text);
  font-weight: 600;
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 0.9rem;
}

.empty {
  color: var(--muted);
  margin: 1rem 0;
}

.journal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.journal-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.85rem;
  background: var(--surface-alt);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.6rem;
}

.skeleton-card {
  height: 120px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(90deg, var(--surface-alt), var(--surface), var(--surface-alt));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.6);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 100;
}

.sheet {
  background: var(--surface);
  width: min(520px, 100%);
  border-radius: 18px;
  border: 1px solid var(--border);
  padding: 1rem;
  box-shadow: var(--shadow);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.75rem;
  font-weight: 600;
}

textarea {
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 0.7rem 0.8rem;
  background: var(--surface-alt);
  font-family: inherit;
  resize: vertical;
}

.sheet-actions {
  margin-top: 0.85rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button.ghost {
  background: var(--surface);
  color: var(--text);
  box-shadow: none;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
