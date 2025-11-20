<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/services/api'

interface AdminPackage {
  id: number
  name: string
  description?: string | null
  price: number | string
  promoPrice?: number | string | null
  promoExpiresAt?: string | null
  durationDays: number
  isActive: boolean
  createdAt: string
  features?: unknown
  bundleItems?: unknown
}

type PackageFormState = {
  id: number | null
  name: string
  description: string
  price: number | string
  promoPrice?: number | string
  promoExpiresAt?: string
  durationDays: number | string
  features: string
  bundleItems: string
  isActive: boolean
}

type PromoFormState = {
  code: string
  description: string
  discountType: 'PERCENT' | 'FIXED'
  value: number | string
  maxDiscount: number | string
  minAmount: number | string
  startsAt: string
  endsAt: string
  usageLimit: number | string
  isActive: boolean
  packageId: number | '' | null
}

type Promo = {
  id: number
  code: string
  description?: string | null
  discountType: 'PERCENT' | 'FIXED'
  value: number | string
  maxDiscount?: number | string | null
  minAmount?: number | string | null
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
  usedCount?: number
  isActive: boolean
  packageId?: number | null
  package?: AdminPackage
}

const packages = ref<AdminPackage[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

const packageActionId = ref<number | null>(null)
const packageDeleteId = ref<number | null>(null)
const packageFormError = ref('')
const savingPackage = ref(false)
const promos = ref<Promo[]>([])
const promoLoading = ref(false)
const promoMessage = ref('')
const promoFormError = ref('')
const savingPromo = ref(false)

const emptyPackageForm = (): PackageFormState => ({
  id: null,
  name: '',
  description: '',
  price: '',
  promoPrice: '',
  promoExpiresAt: '',
  durationDays: '',
  features: '',
  bundleItems: '',
  isActive: true,
})

const packageForm = ref<PackageFormState>(emptyPackageForm())
const promoForm = ref<PromoFormState>({
  code: '',
  description: '',
  discountType: 'PERCENT',
  value: '',
  maxDiscount: '',
  minAmount: '',
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  isActive: true,
  packageId: '',
})

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

const fetchPromos = async () => {
  promoLoading.value = true
  promoMessage.value = ''
  promoFormError.value = ''
  try {
    const res = await api.get('/admin/promos')
    promos.value = res.data
  } catch (err: any) {
    promoFormError.value = err?.response?.data?.message || 'Gagal memuat kode promo.'
  } finally {
    promoLoading.value = false
  }
}

const startEditPackage = (pkg: AdminPackage) => {
  packageForm.value = {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || '',
    price: pkg.price,
    promoPrice: pkg.promoPrice || '',
    promoExpiresAt: pkg.promoExpiresAt ? pkg.promoExpiresAt.substring(0, 10) : '',
    durationDays: pkg.durationDays,
    features: pkg.features ? JSON.stringify(pkg.features) : '',
    bundleItems: pkg.bundleItems ? JSON.stringify(pkg.bundleItems) : '',
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
    promoPrice: packageForm.value.promoPrice ? Number(packageForm.value.promoPrice) : undefined,
    promoExpiresAt: packageForm.value.promoExpiresAt || undefined,
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

  if (packageForm.value.bundleItems) {
    try {
      const parsedBundle = JSON.parse(packageForm.value.bundleItems as string)
      payload.bundleItems = JSON.stringify(parsedBundle)
    } catch (_err) {
      packageFormError.value = 'Format bundle harus JSON valid (mis. ["PT 4x","Locker"]).'
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

const submitPromoForm = async () => {
  promoFormError.value = ''
  promoMessage.value = ''

  if (!promoForm.value.code || !promoForm.value.value) {
    promoFormError.value = 'Kode dan nilai promo wajib diisi.'
    return
  }

  savingPromo.value = true
  try {
    await api.post('/admin/promos', {
      ...promoForm.value,
      value: Number(promoForm.value.value),
      maxDiscount: promoForm.value.maxDiscount ? Number(promoForm.value.maxDiscount) : undefined,
      minAmount: promoForm.value.minAmount ? Number(promoForm.value.minAmount) : undefined,
      usageLimit: promoForm.value.usageLimit ? Number(promoForm.value.usageLimit) : undefined,
      packageId: promoForm.value.packageId || undefined,
    })
    promoMessage.value = 'Kode promo dibuat.'
    promoForm.value = {
      code: '',
      description: '',
      discountType: 'PERCENT',
      value: '',
      maxDiscount: '',
      minAmount: '',
      startsAt: '',
      endsAt: '',
      usageLimit: '',
      isActive: true,
      packageId: '',
    }
    await fetchPromos()
  } catch (err: any) {
    promoFormError.value = err?.response?.data?.message || 'Gagal membuat kode promo.'
  } finally {
    savingPromo.value = false
  }
}

const deletePromo = async (promo: Promo) => {
  const confirmDelete = window.confirm(`Hapus kode promo "${promo.code}"?`)
  if (!confirmDelete) return
  try {
    await api.delete(`/admin/promos/${promo.id}`)
    promoMessage.value = `Kode promo ${promo.code} dihapus.`
    await fetchPromos()
  } catch (err: any) {
    promoFormError.value = err?.response?.data?.message || 'Gagal menghapus kode promo.'
  }
}

onMounted(() => {
  fetchPackages()
  fetchPromos()
})
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
            <span>Harga Promo</span>
            <input
              v-model="packageForm.promoPrice"
              type="number"
              min="0"
              step="1000"
              placeholder="1200000"
            />
          </label>
          <label class="form-field">
            <span>Promo berlaku sampai</span>
            <input v-model="packageForm.promoExpiresAt" type="date" />
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
          <label class="form-field full">
            <span>Bundle (JSON opsional)</span>
            <textarea
              v-model="packageForm.bundleItems"
              rows="2"
              placeholder='["Personal trainer 4x","Locker bulanan"]'
            ></textarea>
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
              <th>Promo</th>
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
              <td>
                <template v-if="pkg.promoPrice">
                  <span class="badge">{{ formatCurrency(pkg.promoPrice) }}</span>
                  <small v-if="pkg.promoExpiresAt" class="muted tiny-inline">s/d {{ pkg.promoExpiresAt?.slice(0, 10) }}</small>
                </template>
                <span v-else class="muted">-</span>
              </td>
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
              <td colspan="7" class="muted">Belum ada paket di katalog.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="promo-section card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Kode promo</p>
          <h3>Buat & kelola promo</h3>
          <p class="muted">Diskon % atau nominal, bisa dibatasi paket dan periode.</p>
        </div>
        <button type="button" class="ghost-btn" @click="fetchPromos">Refresh promo</button>
      </div>

      <div class="promo-grid">
        <form class="promo-form" @submit.prevent="submitPromoForm">
          <div class="form-grid">
            <label class="form-field">
              <span>Kode*</span>
              <input v-model="promoForm.code" type="text" placeholder="GYM50" required />
            </label>
            <label class="form-field">
              <span>Jenis</span>
              <select v-model="promoForm.discountType">
                <option value="PERCENT">Persen (%)</option>
                <option value="FIXED">Nominal</option>
              </select>
            </label>
            <label class="form-field">
              <span>Nilai*</span>
              <input v-model="promoForm.value" type="number" min="0" step="1" required />
            </label>
            <label class="form-field">
              <span>Diskon maks</span>
              <input v-model="promoForm.maxDiscount" type="number" min="0" step="1000" placeholder="100000" />
            </label>
            <label class="form-field">
              <span>Min. transaksi</span>
              <input v-model="promoForm.minAmount" type="number" min="0" step="1000" placeholder="200000" />
            </label>
            <label class="form-field">
              <span>Mulai</span>
              <input v-model="promoForm.startsAt" type="date" />
            </label>
            <label class="form-field">
              <span>Berakhir</span>
              <input v-model="promoForm.endsAt" type="date" />
            </label>
            <label class="form-field">
              <span>Kuota pakai</span>
              <input v-model="promoForm.usageLimit" type="number" min="1" step="1" placeholder="50" />
            </label>
            <label class="form-field">
              <span>Terapkan ke paket</span>
              <select v-model="promoForm.packageId">
                <option value="">Semua paket</option>
                <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">{{ pkg.name }}</option>
              </select>
            </label>
            <label class="form-field checkbox">
              <input v-model="promoForm.isActive" type="checkbox" />
              <span>Aktif</span>
            </label>
            <label class="form-field full">
              <span>Deskripsi</span>
              <textarea
                v-model="promoForm.description"
                rows="2"
                placeholder="Mis. Diskon 50% khusus paket Platinum"
              ></textarea>
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="savingPromo">{{ savingPromo ? 'Menyimpan...' : 'Tambah Promo' }}</button>
            <p v-if="promoFormError" class="form-error">{{ promoFormError }}</p>
            <p v-if="promoMessage" class="form-success">{{ promoMessage }}</p>
          </div>
        </form>

        <div class="promo-list">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Jenis</th>
                <th>Nilai</th>
                <th>Paket</th>
                <th>Masa</th>
                <th>Kuota</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="promo in promos" :key="promo.id">
                <td>
                  <strong>{{ promo.code }}</strong>
                  <div class="muted small-text">{{ promo.description }}</div>
                  <span :class="['badge', promo.isActive ? 'admin' : '']">{{ promo.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                </td>
                <td>{{ promo.discountType }}</td>
                <td>
                  <span v-if="promo.discountType === 'PERCENT'">{{ promo.value }}%</span>
                  <span v-else>{{ formatCurrency(promo.value) }}</span>
                  <div v-if="promo.maxDiscount" class="muted small-text">Maks {{ formatCurrency(promo.maxDiscount) }}</div>
                  <div v-if="promo.minAmount" class="muted small-text">Min {{ formatCurrency(promo.minAmount) }}</div>
                </td>
                <td>{{ promo.package?.name || (promo.packageId ? `#${promo.packageId}` : 'Semua') }}</td>
                <td>
                  <div class="muted small-text">Mulai: {{ promo.startsAt ? promo.startsAt.slice(0, 10) : '-' }}</div>
                  <div class="muted small-text">Sampai: {{ promo.endsAt ? promo.endsAt.slice(0, 10) : '-' }}</div>
                </td>
                <td>
                  <div class="muted small-text">Digunakan: {{ promo.usedCount || 0 }}</div>
                  <div class="muted small-text">Kuota: {{ promo.usageLimit || '∞' }}</div>
                </td>
                <td>
                  <button type="button" class="ghost-btn danger" @click="deletePromo(promo)">Hapus</button>
                </td>
              </tr>
              <tr v-if="!promoLoading && !promos.length">
                <td colspan="7" class="muted">Belum ada kode promo.</td>
              </tr>
              <tr v-if="promoLoading">
                <td colspan="7" class="muted">Memuat promo...</td>
              </tr>
            </tbody>
          </table>
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
.tiny-inline {
  display: block;
  font-size: 0.85rem;
}

.promo-section {
  margin-top: 1rem;
}

.promo-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 1rem;
}

.promo-form {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem;
  background: var(--surface-alt);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.promo-list {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow-x: auto;
}

.small-text {
  font-size: 0.9rem;
}

.form-success {
  color: #0f766e;
  margin: 0.25rem 0 0;
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

  .promo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
