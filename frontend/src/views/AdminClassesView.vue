<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import api from '@/services/api'

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
  status?: ClassStatus
}

type ClassStatus = 'upcoming' | 'ongoing' | 'finished'

const classes = ref<GymClass[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')
const saving = ref(false)
const statusFilter = ref<'all' | ClassStatus>('all')
const editingId = ref<number | null>(null)
const bookingsLoading = ref(false)
const bookingsError = ref('')
const selectedClassId = ref<number | null>(null)
const selectedClassTitle = ref('')
const bookings = ref<
  Array<{
    id: number
    status: string
    user?: { name?: string; email?: string }
    checkinToken?: string
    createdAt: string
    checkedInAt?: string | null
  }>
>([])

const classForm = ref({
  title: '',
  description: '',
  instructor: '',
  location: '',
  startTime: '',
  endTime: '',
  capacity: 20,
})

const formatDate = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const fetchClasses = async () => {
  loading.value = true
  error.value = ''
  try {
    const query = statusFilter.value === 'all' ? '' : `?status=${statusFilter.value}`
    const res = await api.get(`/admin/classes${query}`)
    classes.value = res.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat kelas.'
  } finally {
    loading.value = false
  }
}

const deletingId = ref<number | null>(null)

const deleteClass = async (id: number) => {
  const confirmDelete = window.confirm('Hapus kelas ini? Booking terkait akan ikut dihapus.')
  if (!confirmDelete) return
  deletingId.value = id
  error.value = ''
  message.value = ''
  try {
    await api.delete(`/admin/classes/${id}`)
    message.value = 'Kelas dihapus.'
    await fetchClasses()
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal menghapus kelas.'
  } finally {
    deletingId.value = null
  }
}

const resetForm = () => {
  classForm.value = {
    title: '',
    description: '',
    instructor: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: 20,
  }
}

const submitClass = async () => {
  message.value = ''
  error.value = ''
  if (!classForm.value.title || !classForm.value.startTime || !classForm.value.endTime) {
    error.value = 'Judul, mulai, dan selesai wajib diisi.'
    return
  }
  if (new Date(classForm.value.endTime) <= new Date(classForm.value.startTime)) {
    error.value = 'Waktu selesai harus setelah waktu mulai.'
    return
  }

  saving.value = true
  try {
    const payload = {
      ...classForm.value,
      startTime: new Date(classForm.value.startTime).toISOString(),
      endTime: new Date(classForm.value.endTime).toISOString(),
    }
    if (editingId.value) {
      await api.put(`/admin/classes/${editingId.value}`, payload)
      message.value = 'Kelas diperbarui.'
    } else {
      await api.post('/admin/classes', payload)
      message.value = 'Kelas dibuat.'
    }
    resetForm()
    editingId.value = null
    fetchClasses()
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal menyimpan kelas.'
  } finally {
    saving.value = false
  }
}

const statusLabel = (status: ClassStatus) => {
  if (status === 'ongoing') return 'Berlangsung'
  if (status === 'finished') return 'Selesai'
  return 'Akan datang'
}

const startEdit = (cls: GymClass) => {
  classForm.value = {
    title: cls.title,
    description: cls.description || '',
    instructor: cls.instructor || '',
    location: cls.location || '',
    startTime: cls.startTime ? new Date(cls.startTime).toISOString().slice(0, 16) : '',
    endTime: cls.endTime ? new Date(cls.endTime).toISOString().slice(0, 16) : '',
    capacity: cls.capacity,
  }
  editingId.value = cls.id
}

const cancelEdit = () => {
  editingId.value = null
  resetForm()
}

const fetchBookings = async (cls: GymClass) => {
  bookingsLoading.value = true
  bookingsError.value = ''
  selectedClassId.value = cls.id
  selectedClassTitle.value = cls.title
  bookings.value = []
  try {
    const res = await api.get(`/admin/classes/${cls.id}/bookings`)
    bookings.value = res.data
  } catch (err: any) {
    bookingsError.value = err?.response?.data?.message || 'Gagal memuat peserta.'
  } finally {
    bookingsLoading.value = false
  }
}

const cancelBooking = async (bookingId: number) => {
  if (!selectedClassId.value) return
  const ok = window.confirm('Batalkan booking ini?')
  if (!ok) return
  try {
    await api.patch(`/admin/classes/bookings/${bookingId}/cancel`)
    await fetchBookings({
      id: selectedClassId.value,
      title: selectedClassTitle.value,
      startTime: '',
      endTime: '',
      capacity: 0,
    } as GymClass)
  } catch (err: any) {
    bookingsError.value = err?.response?.data?.message || 'Gagal membatalkan booking.'
  }
}

const checkinBooking = async (bookingId: number) => {
  if (!selectedClassId.value) return
  try {
    await api.patch(`/admin/classes/bookings/${bookingId}/checkin`)
    await fetchBookings({
      id: selectedClassId.value,
      title: selectedClassTitle.value,
      startTime: '',
      endTime: '',
      capacity: 0,
    } as GymClass)
  } catch (err: any) {
    bookingsError.value = err?.response?.data?.message || 'Gagal check-in booking.'
  }
}

watch(statusFilter, () => {
  fetchClasses()
})

onMounted(fetchClasses)
</script>

<template>
  <main class="page">
    <div class="section-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h2>Kelola Jadwal Kelas</h2>
        <p class="muted">Buat jadwal, kapasitas, dan lihat slot tersedia.</p>
      </div>
      <div class="actions">
        <select v-model="statusFilter">
          <option value="all">Semua status</option>
          <option value="upcoming">Akan datang</option>
          <option value="ongoing">Berlangsung</option>
          <option value="finished">Selesai</option>
        </select>
        <button type="button" class="ghost-btn" @click="fetchClasses">Refresh</button>
      </div>
    </div>

    <div v-if="message" class="alert success">{{ message }}</div>
    <div v-if="error" class="alert error">{{ error }}</div>

    <div class="grid">
      <form class="card form-card" @submit.prevent="submitClass">
        <div class="form-grid">
          <label class="form-field">
            <span>Judul*</span>
            <input v-model="classForm.title" type="text" required placeholder="HIIT Pagi" />
          </label>
          <label class="form-field">
            <span>Instruktur</span>
            <input v-model="classForm.instructor" type="text" placeholder="Coach Dika" />
          </label>
          <label class="form-field">
            <span>Lokasi</span>
            <input v-model="classForm.location" type="text" placeholder="Studio A" />
          </label>
          <label class="form-field">
            <span>Kapasitas</span>
            <input v-model.number="classForm.capacity" type="number" min="1" step="1" />
          </label>
          <label class="form-field">
            <span>Mulai*</span>
            <input v-model="classForm.startTime" type="datetime-local" required />
          </label>
          <label class="form-field">
            <span>Selesai*</span>
            <input v-model="classForm.endTime" type="datetime-local" required />
          </label>
          <label class="form-field full">
            <span>Deskripsi</span>
            <textarea v-model="classForm.description" rows="2" placeholder="Durasi 45 menit, intensitas tinggi."></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="saving">
            {{ saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Kelas' }}
          </button>
          <button type="button" class="ghost-btn" @click="editingId ? cancelEdit() : resetForm()">
            {{ editingId ? 'Batal Edit' : 'Reset' }}
          </button>
        </div>
      </form>

      <div class="card list-card">
        <div class="section-head">
          <h3>Jadwal kelas</h3>
          <small class="muted">Filter status: {{ statusFilter }}</small>
        </div>
        <div v-if="loading" class="skeleton-list">
          <div class="shimmer line wide"></div>
          <div class="shimmer line mid"></div>
          <div class="shimmer line"></div>
        </div>
        <div v-else-if="!classes.length" class="empty">Belum ada kelas.</div>
        <div v-else class="list">
          <div v-for="cls in classes" :key="cls.id" class="list-item">
            <div>
              <p class="eyebrow">{{ formatDate(cls.startTime) }}</p>
              <strong>{{ cls.title }}</strong>
              <p class="muted">{{ cls.description }}</p>
              <div class="muted tiny">Instruktur: {{ cls.instructor || '-' }}</div>
              <div class="muted tiny">Lokasi: {{ cls.location || 'Gym' }}</div>
            </div>
            <div class="meta">
              <span class="badge">Kapasitas {{ cls.capacity }}</span>
              <span class="badge alt">Sisa {{ cls.availableSlots ?? cls.capacity }}</span>
              <span :class="['status-badge', cls.status]">{{ statusLabel(cls.status || 'upcoming') }}</span>
              <div class="meta-actions">
                <button type="button" class="ghost-btn small" @click="startEdit(cls)">Edit</button>
                <button
                  type="button"
                  class="ghost-btn small"
                  @click="fetchBookings(cls)"
                  :disabled="selectedClassId === cls.id && bookingsLoading"
                >
                  {{ selectedClassId === cls.id ? 'Memuat...' : 'Peserta' }}
                </button>
                <button
                  type="button"
                  class="ghost-btn danger small"
                  :disabled="deletingId === cls.id"
                  @click="deleteClass(cls.id)"
                >
                  {{ deletingId === cls.id ? 'Menghapus...' : 'Hapus' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bookings-card">
        <div class="section-head">
          <div>
            <h3>Peserta kelas</h3>
            <p class="muted">
              {{ selectedClassTitle ? 'Kelas: ' + selectedClassTitle : 'Pilih kelas untuk melihat peserta.' }}
            </p>
          </div>
        </div>
        <div v-if="bookingsLoading" class="skeleton-list">
          <div class="shimmer line wide"></div>
          <div class="shimmer line mid"></div>
        </div>
        <div v-else-if="bookingsError" class="alert error">{{ bookingsError }}</div>
        <div v-else-if="selectedClassId && !bookings.length" class="empty">Belum ada booking.</div>
        <div v-else-if="!selectedClassId" class="empty">Belum ada kelas dipilih.</div>
        <div v-else class="booking-list">
          <div v-for="booking in bookings" :key="booking.id" class="booking-row">
            <div>
              <strong>{{ booking.user?.name || 'Tanpa nama' }}</strong>
              <p class="muted tiny">{{ booking.user?.email || '-' }}</p>
              <p class="muted tiny">Token (dinamis): {{ booking.checkinToken || '-' }}</p>
            </div>
            <div class="booking-actions">
              <span class="status-badge" :class="booking.status">{{ booking.status }}</span>
              <button
                type="button"
                class="ghost-btn small"
                @click="checkinBooking(booking.id)"
                :disabled="booking.status === 'checked_in'"
              >
                Check-in
              </button>
              <button type="button" class="ghost-btn danger small" @click="cancelBooking(booking.id)">
                Batalkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.actions select {
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.8rem;
  color: var(--muted);
}
.muted {
  color: var(--muted);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 1rem;
  align-items: start;
}
.form-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--surface-alt);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.65rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--text);
}
.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.form-field.full {
  grid-column: 1 / -1;
}
.form-actions {
  display: flex;
  gap: 0.5rem;
}
.list-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--surface);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--muted);
}
.toggle input {
  accent-color: var(--primary);
  width: 18px;
  height: 18px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.list-item {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  background: var(--surface);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-end;
}
.meta-actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.badge {
  background: var(--primary-contrast);
  color: var(--primary);
  border-radius: 10px;
  padding: 0.25rem 0.65rem;
  font-weight: 700;
  font-size: 0.85rem;
}
.badge.alt {
  background: var(--surface-alt);
}
.status-badge {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-weight: 700;
  font-size: 0.82rem;
}
.status-badge.ongoing {
  background: #fff3cd;
  color: #b26b00;
}
.status-badge.finished {
  background: #f4f7fb;
  color: #5b6476;
}
.status-badge.cancelled {
  background: #ffe7e7;
  color: #c62828;
}
.status-badge.checked_in {
  background: #e7fff6;
  color: #0f9d98;
}
.ghost-btn.danger.small {
  padding: 0.25rem 0.55rem;
  font-size: 0.9rem;
}
.ghost-btn.small {
  padding: 0.25rem 0.55rem;
  font-size: 0.9rem;
}
.alert {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.alert.success {
  background: #e7fff6;
  border-color: #b2f5ea;
  color: #0f9d98;
}
.alert.error {
  background: #ffe7e7;
  border-color: #ffcdd2;
  color: #c62828;
}
.skeleton-list .line {
  height: 14px;
  border-radius: 10px;
  margin: 0.35rem 0;
}
.shimmer {
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
.empty {
  padding: 1rem;
  color: var(--muted);
  background: var(--surface-alt);
  border: 1px dashed var(--border);
  border-radius: 12px;
}
.bookings-card {
  grid-column: 1 / -1;
  padding: 1rem;
}
.booking-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.booking-row {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface);
}
.booking-actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
@media (max-width: 960px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .list-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .meta {
    align-items: flex-start;
  }
}
</style>
