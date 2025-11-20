<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/services/api'

interface AdminPackage {
  id: number
  name: string
  description?: string | null
  price: number | string
  durationDays: number
  isActive: boolean
  createdAt: string
  features?: unknown
}

type PackageFormState = {
  id: number | null
  name: string
  description: string
  price: number | string
  durationDays: number | string
  features: string
  isActive: boolean
}

const packages = ref<AdminPackage[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

const packageActionId = ref<number | null>(null)
const packageDeleteId = ref<number | null>(null)
const packageFormError = ref('')
const savingPackage = ref(false)

const emptyPackageForm = (): PackageFormState => ({
  id: null,
  name: '',
  description: '',
  price: '',
  durationDays: '',
  features: '',
  isActive: true,
})

const packageForm = ref<PackageFormState>(emptyPackageForm())

const formatCurrency = (value: string | number) => {
  const amount = typeof value === 'number' ? value : Number(value || 0)
  return `Rp${amount.toLocaleString('id-ID')}`
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const fetchPackages = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/admin/packages')
    packages.value = res.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat data paket.'
  } finally {
    loading.value = false
  }
}

const startEditPackage = (pkg: AdminPackage) => {
  packageForm.value = {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || '',
    price: pkg.price,
    durationDays: pkg.durationDays,
    features: pkg.features ? JSON.stringify(pkg.features) : '',
    isActive: pkg.isActive,
  }
  packageFormError.value = ''
  message.value = ''
}

const resetPackageForm = () => {
  packageForm.value = emptyPackageForm()
  packageFormError.value = ''
  message.value = ''
  error.value = ''
}

const togglePackageStatus = async (pkg: AdminPackage) => {
  packageActionId.value = pkg.id
  message.value = ''
  error.value = ''
  packageFormError.value = ''
  try {
    const res = await api.put(`/admin/packages/${pkg.id}`, { isActive: !pkg.isActive })
    const updated = res?.data || { ...pkg, isActive: !pkg.isActive }
    packages.value = packages.value.map((p) => (p.id === pkg.id ? { ...p, ...updated } : p))
    message.value = `Status paket "${pkg.name}" diperbarui.`
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal mengubah status paket.'
  } finally {
    packageActionId.value = null
  }
}

const submitPackageForm = async () => {
  packageFormError.value = ''
  message.value = ''
  error.value = ''

  if (!packageForm.value.name || !packageForm.value.price || !packageForm.value.durationDays) {
    packageFormError.value = 'Nama, harga, dan durasi wajib diisi.'
    return
  }

  const payload: any = {
    name: packageForm.value.name,
    description: packageForm.value.description || undefined,
    price: Number(packageForm.value.price),
    durationDays: Number(packageForm.value.durationDays),
    isActive: packageForm.value.isActive,
  }

  if (packageForm.value.features) {
    try {
      const parsed = JSON.parse(packageForm.value.features as string)
      payload.features = JSON.stringify(parsed)
    } catch (_err) {
      packageFormError.value = 'Format fitur harus JSON valid (mis. ["Akses penuh","Gratis handuk"]).'
      return
    }
  }

  savingPackage.value = true
  try {
    let successMessage = ''
    if (packageForm.value.id) {
      await api.put(`/admin/packages/${packageForm.value.id}`, payload)
      successMessage = 'Paket diperbarui.'
    } else {
      await api.post('/admin/packages', payload)
      successMessage = 'Paket baru dibuat.'
    }
    await fetchPackages()
    resetPackageForm()
    message.value = successMessage
  } catch (err: any) {
    packageFormError.value = err?.response?.data?.message || 'Gagal menyimpan paket.'
  } finally {
    savingPackage.value = false
  }
}

const deletePackage = async (pkg: AdminPackage) => {
  const confirmDelete = window.confirm(`Hapus paket "${pkg.name}"?`)
  if (!confirmDelete) return

  packageDeleteId.value = pkg.id
  message.value = ''
  error.value = ''
  packageFormError.value = ''
  try {
    await api.delete(`/admin/packages/${pkg.id}`)
    packages.value = packages.value.filter((p) => p.id !== pkg.id)
    message.value = `Paket "${pkg.name}" dihapus.`
    if (packageForm.value.id === pkg.id) {
      resetPackageForm()
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || `Gagal menghapus paket ${pkg.name}.`
  } finally {
    packageDeleteId.value = null
  }
}

onMounted(fetchPackages)
</script>

<template>
  <main class="page">
    <header class="section-head">
      <div>
        <div class="pill">Admin • Paket</div>
        <h1>Kelola paket membership</h1>
        <p class="sub">Tambah, perbarui, nonaktifkan, atau hapus paket gym.</p>
      </div>
      <button type="button" class="ghost-btn" @click="fetchPackages">Refresh</button>
    </header>

    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="message" class="message success">{{ message }}</div>

    <div v-if="loading" class="skeleton-grid">
      <div class="skeleton card form-skeleton">
        <div class="shimmer line wide"></div>
        <div class="form-skeleton-grid">
          <div v-for="n in 5" :key="`form-${n}`" class="shimmer line block"></div>
          <div class="shimmer line block wide"></div>
        </div>
        <div class="actions-skeleton">
          <div class="shimmer line btn"></div>
          <div class="shimmer line btn ghost"></div>
        </div>
      </div>

      <div class="skeleton card table-skeleton">
        <div class="table-head-skeleton">
          <div v-for="n in 6" :key="`head-${n}`" class="shimmer pill-skeleton"></div>
        </div>
        <div class="table-body-skeleton">
          <div v-for="row in 4" :key="`row-${row}`" class="table-row-skeleton">
            <div v-for="col in 6" :key="`row-${row}-col-${col}`" class="shimmer line"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="package-grid">
      <form class="package-form" @submit.prevent="submitPackageForm">
        <div class="form-grid">
          <label class="form-field">
            <span>Nama*</span>
            <input v-model="packageForm.name" type="text" placeholder="Contoh: Platinum" required />
          </label>
          <label class="form-field">
            <span>Harga*</span>
            <input
              v-model="packageForm.price"
              type="number"
              min="0"
              step="1000"
              placeholder="1500000"
              required
            />
          </label>
          <label class="form-field">
            <span>Durasi (hari)*</span>
            <input
              v-model="packageForm.durationDays"
              type="number"
              min="1"
              step="1"
              placeholder="365"
              required
            />
          </label>
          <label class="form-field">
            <span>Status</span>
            <select v-model="packageForm.isActive">
              <option :value="true">Aktif</option>
              <option :value="false">Nonaktif</option>
            </select>
          </label>
          <label class="form-field full">
            <span>Deskripsi</span>
            <textarea v-model="packageForm.description" rows="2" placeholder="Tuliskan highlight paket"></textarea>
          </label>
          <label class="form-field full">
            <span>Fitur (JSON opsional)</span>
            <textarea v-model="packageForm.features" rows="3" placeholder='["Akses penuh","Gratis handuk"]'></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="savingPackage">
            {{ savingPackage ? 'Menyimpan...' : packageForm.id ? 'Perbarui Paket' : 'Tambah Paket' }}
          </button>
          <button type="button" class="ghost-btn" @click="resetPackageForm">Reset</button>
        </div>
        <p v-if="packageFormError" class="form-error">{{ packageFormError }}</p>
      </form>

      <div class="table-wrapper wide">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Harga</th>
              <th>Durasi</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pkg in packages" :key="pkg.id">
              <td>{{ pkg.name }}</td>
              <td>{{ formatCurrency(pkg.price) }}</td>
              <td>{{ pkg.durationDays }} hari</td>
              <td>
                <span :class="['status', pkg.isActive ? 'success' : 'failed']">
                  {{ pkg.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>{{ formatDateTime(pkg.createdAt) }}</td>
              <td>
                <div class="table-actions packages">
                  <button type="button" class="ghost-btn" @click="startEditPackage(pkg)">Edit</button>
                  <button
                    type="button"
                    class="ghost-btn"
                    :disabled="packageActionId === pkg.id"
                    @click="togglePackageStatus(pkg)"
                  >
                    {{ packageActionId === pkg.id ? 'Menyimpan...' : pkg.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                  <button
                    type="button"
                    class="ghost-btn danger"
                    :disabled="packageDeleteId === pkg.id"
                    @click="deletePackage(pkg)"
                  >
                    {{ packageDeleteId === pkg.id ? 'Menghapus...' : 'Hapus' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!packages.length">
              <td colspan="6" class="muted">Belum ada paket di katalog.</td>
            </tr>
          </tbody>
        </table>
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
  gap: 1rem;
}

.sub {
  margin: 0.2rem 0 0;
  color: var(--muted);
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
  font-size: 0.9rem;
}

.ghost-btn {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: none;
  padding: 0.45rem 0.8rem;
}

.ghost-btn:hover {
  background: var(--primary-contrast);
}

.message.error {
  background: #ffe7e7;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
}

.message.success {
  background: #e9fbf8;
  border: 1px solid #b6ebe2;
  color: #0f766e;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
}

.skeleton {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 1rem;
  align-items: stretch;
}

.shimmer {
  background: linear-gradient(90deg, var(--surface-alt), var(--surface), var(--surface-alt));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.line {
  height: 14px;
  border-radius: 8px;
  margin: 0.4rem 0;
}
.line.block {
  height: 36px;
}
.line.wide {
  width: 80%;
}
.line.mid {
  width: 60%;
}
.line.btn {
  width: 130px;
  height: 36px;
  border-radius: 10px;
}
.line.btn.ghost {
  width: 100px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.package-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 1rem;
}

.form-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.5rem;
}

.actions-skeleton {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.table-head-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.35rem;
}

.pill-skeleton {
  height: 30px;
  border-radius: 999px;
}

.table-body-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.table-row-skeleton {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.package-form {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--surface-alt);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
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
  align-items: center;
  gap: 0.5rem;
}

.form-error {
  color: #c62828;
  margin: 0.25rem 0 0;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-wrapper.wide table {
  min-width: 760px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.55rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  font-size: 0.9rem;
  color: var(--muted);
  font-weight: 700;
}

.status {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-weight: 700;
  border: 1px solid var(--border);
  text-transform: capitalize;
}

.status.success {
  background: var(--primary-contrast);
  color: var(--primary);
}

.status.failed {
  background: #ffe7e7;
  color: #c62828;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: nowrap;
}

.ghost-btn.danger {
  border-color: #f26c2d;
  color: #f26c2d;
}

.muted {
  color: var(--muted);
}

@media (max-width: 960px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .package-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
