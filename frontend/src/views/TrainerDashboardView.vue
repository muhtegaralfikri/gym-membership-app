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

type SlotInput = { dayOfWeek: number; startTime: string; endTime: string }
const dayInput = ref<number>(1)
const startInput = ref('09:00')
const endInput = ref('10:00')
const availabilitySlots = ref<SlotInput[]>([])
const scheduleSaving = ref(false)
const scheduleMessage = ref('')
const scheduleError = ref('')

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

const agendaSessions = computed(() =>
  sessions.value
    .filter((s) => s.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
)

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

const recentCompleted = computed(() => completedSessions.value.slice(0, 10))

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

const addSlot = () => {
  scheduleMessage.value = ''
  scheduleError.value = ''
  if (dayInput.value < 0 || dayInput.value > 6) {
    scheduleError.value = 'Hari harus 0-6.'
    return
  }
  if (!startInput.value || !endInput.value) {
    scheduleError.value = 'Isi jam mulai dan selesai.'
    return
  }
  if (startInput.value >= endInput.value) {
    scheduleError.value = 'Jam selesai harus setelah jam mulai.'
    return
  }
  availabilitySlots.value = [
    ...availabilitySlots.value.filter(
      (s) =>
        !(
          s.dayOfWeek === dayInput.value &&
          s.startTime === startInput.value &&
          s.endTime === endInput.value
        ),
    ),
    {
      dayOfWeek: dayInput.value,
      startTime: startInput.value,
      endTime: endInput.value,
    },
  ]
}

const removeSlot = (slot: SlotInput) => {
  availabilitySlots.value = availabilitySlots.value.filter(
    (s) =>
      !(
        s.dayOfWeek === slot.dayOfWeek &&
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime
      ),
  )
}

const saveSchedule = async () => {
  scheduleMessage.value = ''
  scheduleError.value = ''
  if (!availabilitySlots.value.length) {
    scheduleError.value = 'Tambahkan minimal satu slot.'
    return
  }
  scheduleSaving.value = true
  try {
    await api.post('/trainers/schedule', {
      slots: availabilitySlots.value,
    })
    scheduleMessage.value = 'Jadwal tersimpan. Slot akan muncul di halaman member.'
  } catch (err: any) {
    scheduleError.value = err?.response?.data?.message || 'Gagal menyimpan jadwal.'
  } finally {
    scheduleSaving.value = false
  }
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

    <section class="card calendar-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Kalender</p>
          <h3>Agenda personal</h3>
          <p class="muted helper">Lihat daftar jadwal Anda dan tandai selesai langsung dari tabel.</p>
        </div>
        <button type="button" class="ghost" @click="fetchSessions" :disabled="loading">
          {{ loading ? 'Memuat...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="loading" class="skeleton-table">
        <div class="skeleton-line" v-for="n in 5" :key="n"></div>
      </div>
      <p v-else-if="!agendaSessions.length" class="empty">Belum ada sesi di agenda.</p>
      <div v-else class="table-wrapper">
        <table class="data-table responsive">
          <thead>
            <tr>
              <th>Tanggal & waktu</th>
              <th>Member</th>
              <th>Status</th>
              <th>Catatan</th>
              <th class="action-col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in agendaSessions" :key="session.id">
              <td data-label="Tanggal & waktu">
                <div class="cell-main">
                  <p class="eyebrow">{{ formatDate(session.scheduledAt) }}</p>
                  <p class="time">{{ formatTimeRange(session) }}</p>
                </div>
              </td>
              <td data-label="Member">
                <div class="cell-main">
                  <p class="cell-title">{{ session.member?.name || 'Member' }}</p>
                  <p class="muted small">{{ session.member?.email || 'Tidak ada email' }}</p>
                </div>
              </td>
              <td class="status-cell" data-label="Status">
                <span :class="['badge', statusBadge(session.status)]">{{ session.status }}</span>
              </td>
              <td class="notes-cell" data-label="Catatan">
                <span v-if="session.notes">{{ session.notes }}</span>
                <span v-else class="muted">Tidak ada catatan</span>
              </td>
              <td class="table-actions" data-label="Aksi">
                <button
                  v-if="session.status !== 'COMPLETED'"
                  type="button"
                  class="ghost"
                  @click="startComplete(session)"
                >
                  Selesai + catatan
                </button>
                <span v-else class="muted small">Sudah selesai</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card journal" v-if="recentCompleted.length">
      <div class="section-head">
        <div>
          <p class="eyebrow">Log latihan</p>
          <h3>Catatan terkini</h3>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table dense responsive">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Member</th>
              <th>Waktu & durasi</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in recentCompleted" :key="session.id">
              <td data-label="Tanggal">
                <div class="cell-main">
                  <p class="eyebrow">{{ formatDate(session.scheduledAt) }}</p>
                  <span class="badge completed">Selesai</span>
                </div>
              </td>
              <td data-label="Member">
                <div class="cell-main">
                  <p class="cell-title">{{ session.member?.name || 'Member' }}</p>
                  <p class="muted small">{{ session.member?.email || 'Tidak ada email' }}</p>
                </div>
              </td>
              <td data-label="Waktu & durasi">
                <p class="time">{{ formatTimeRange(session) }}</p>
              </td>
              <td class="notes-cell" data-label="Catatan">
                <span v-if="session.notes">{{ session.notes }}</span>
                <span v-else class="muted">Tidak ada catatan</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card schedule-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Kelola jadwal</p>
          <h3>Availability Trainer</h3>
          <p class="muted helper">Tambahkan slot per hari. Jadwal baru menggantikan slot sebelumnya.</p>
        </div>
        <button type="button" class="ghost" @click="addSlot">Tambah slot</button>
      </div>

      <div class="schedule-form">
        <label class="field inline">
          <span>Hari (0=Ahad ... 6=Sabtu)</span>
          <input v-model.number="dayInput" type="number" min="0" max="6" />
        </label>
        <label class="field inline">
          <span>Mulai</span>
          <input v-model="startInput" type="time" />
        </label>
        <label class="field inline">
          <span>Selesai</span>
          <input v-model="endInput" type="time" />
        </label>
        <button type="button" @click="addSlot">Tambah</button>
      </div>

      <div class="slot-chips" v-if="availabilitySlots.length">
        <div class="chip" v-for="slot in availabilitySlots" :key="`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`">
          <span>Hari {{ slot.dayOfWeek }} • {{ slot.startTime }} - {{ slot.endTime }}</span>
          <button type="button" class="ghost" @click="removeSlot(slot)">✕</button>
        </div>
      </div>
      <p v-else class="muted">Belum ada slot. Tambahkan minimal satu.</p>

      <div class="schedule-actions">
        <button type="button" @click="saveSchedule" :disabled="scheduleSaving">
          {{ scheduleSaving ? 'Menyimpan...' : 'Simpan jadwal' }}
        </button>
        <p v-if="scheduleMessage" class="message success">{{ scheduleMessage }}</p>
        <p v-if="scheduleError" class="message error">{{ scheduleError }}</p>
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

.calendar-card {
  padding: 1.25rem;
}

.helper {
  margin: 0.25rem 0 0;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
  margin-top: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

.data-table th,
.data-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 0.9rem;
  letter-spacing: 0.01em;
}

.data-table tr:last-child td {
  border-bottom: 0;
}

.data-table.dense th,
.data-table.dense td {
  padding: 0.5rem 0.65rem;
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cell-title {
  margin: 0;
  font-weight: 700;
}

.status-cell {
  width: 130px;
}

.notes-cell {
  max-width: 320px;
  line-height: 1.5;
}

.action-col {
  width: 140px;
  text-align: right;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
}

.data-table.responsive .action-col {
  text-align: left;
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

.time {
  margin: 0.1rem 0 0;
  font-weight: 700;
}

.micro-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.78rem;
  font-weight: 700;
}

.journal {
  padding: 1.25rem;
}

.schedule-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.schedule-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.65rem;
  align-items: end;
}

.field.inline {
  margin: 0;
}

.slot-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.slot-chips .chip {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.message {
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  margin: 0;
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

.skeleton-table {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  display: grid;
  gap: 0.55rem;
  background: var(--surface-alt);
}

.skeleton-line {
  height: 14px;
  border-radius: 8px;
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

@media (max-width: 720px) {
  .table-wrapper {
    border: 0;
    padding: 0;
  }

  .data-table.responsive {
    min-width: 0;
  }

  .data-table.responsive thead {
    display: none;
  }

  .data-table.responsive tbody {
    display: grid;
    gap: 0.75rem;
  }

  .data-table.responsive tr {
    display: grid;
    gap: 0.4rem;
    padding: 0.85rem 0.85rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
  }

  .data-table.responsive td {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0.35rem;
    border: 0;
    padding: 0;
  }

  .data-table.responsive td::before {
    content: attr(data-label);
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 700;
  }

  .data-table.responsive .table-actions {
    justify-content: flex-start;
  }

  .data-table.responsive .status-cell,
  .data-table.responsive .notes-cell {
    width: auto;
    max-width: none;
  }
}
</style>
