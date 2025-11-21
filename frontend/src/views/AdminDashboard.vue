<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

interface AdminUser {
  id: number
  name: string
  email: string
  phone?: string | null
  isActive?: boolean
  roleId: number
  createdAt: string
}

interface AdminPackage {
  id: number
  name: string
  description?: string | null
  price: string | number
  durationDays: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  features?: unknown
}

type PaymentStatus = 'pending' | 'success' | 'failed'

interface AdminTransaction {
  id: number
  orderId: string
  status: PaymentStatus
  amount: string | number
  createdAt: string
  package?: {
    name: string
    durationDays: number
  }
  user?: {
    name: string
    email: string
  }
}

interface MetricsSummary {
  activeMembers: number
  activeInstructors: number
  latestInitials: string[]
  remainingDays?: number
  averageRemainingDays?: number
}

const authStore = useAuthStore()

const metrics = ref<MetricsSummary>({
  activeMembers: 0,
  activeInstructors: 0,
  latestInitials: [],
  remainingDays: 0,
  averageRemainingDays: 0,
})
const users = ref<AdminUser[]>([])
const transactions = ref<AdminTransaction[]>([])
const packages = ref<AdminPackage[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

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

const totalRevenue = computed(() =>
  transactions.value
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0),
)

const pendingCount = computed(() => transactions.value.filter((t) => t.status === 'pending').length)
const failedCount = computed(() => transactions.value.filter((t) => t.status === 'failed').length)
const activePackageCount = computed(() => packages.value.filter((p) => p.isActive).length)
const latestUsers = computed(() => users.value.slice(0, 6))
const latestTransactions = computed(() => transactions.value.slice(0, 8))

const fetchAdminData = async () => {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    const [metricsRes, usersRes, txRes, packagesRes] = await Promise.all([
      api.get('/metrics/summary'),
      api.get('/admin/users'),
      api.get('/admin/transactions'),
      api.get('/admin/packages'),
    ])

    metrics.value = metricsRes.data
    users.value = usersRes.data
    transactions.value = txRes.data
    packages.value = packagesRes.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat data admin.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAdminData)
</script>

<template>
  <div class="admin-page">
    <header class="hero card">
      <div>
        <div class="pill">Admin Dashboard</div>
        <h1>Kontrol operasi gym</h1>
        <p class="sub">
          Pantau pembayaran, membership aktif, dan paket dalam satu tampilan. Data ditarik langsung
          dari API admin.
        </p>
        <div class="hero-grid">
          <div class="meta-card">
            <span class="label">Member aktif</span>
            <strong>{{ metrics.activeMembers }}</strong>
            <small> Meliputi status active & upcoming</small>
          </div>
          <div class="meta-card">
            <span class="label">Instruktur/admin</span>
            <strong>{{ metrics.activeInstructors }}</strong>
            <small> Role admin terdaftar</small>
          </div>
          <div class="meta-card">
            <span class="label">Rata-rata sisa</span>
            <strong>{{ metrics.remainingDays || metrics.averageRemainingDays || 0 }} hari </strong>
            <small>Durasi membership aktif</small>
          </div>
        </div>
      </div>
      <div class="hero-user">
        <p class="eyebrow">User login</p>
        <h3>{{ authStore.user?.name || 'Admin' }}</h3>
        <p class="muted">{{ authStore.user?.email }}</p>
        <div class="chips">
          <span class="chip">Role: Admin</span>
          <span class="chip">Data real-time</span>
        </div>
      </div>
    </header>

    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="message" class="message success">{{ message }}</div>

    <div v-if="loading" class="skeleton-layout">
      <div class="skeleton card">
        <div class="shimmer line wide"></div>
        <div class="shimmer line mid"></div>
        <div class="shimmer line mid"></div>
      </div>
      <div class="skeleton two-col">
        <div class="card shimmer block"></div>
        <div class="card shimmer block"></div>
        <div class="card shimmer block"></div>
      </div>
    </div>

    <template v-else>
      <section class="stat-grid">
        <div class="stat-card">
          <p class="label">Pendapatan sukses</p>
          <h3>{{ formatCurrency(totalRevenue) }}</h3>
          <small>Akumulasi transaksi settlement</small>
        </div>
        <div class="stat-card alt">
          <p class="label">Transaksi pending</p>
          <h3>{{ pendingCount }}</h3>
          <small>Menunggu pembayaran atau capture</small>
        </div>
        <div class="stat-card warn">
          <p class="label">Transaksi gagal</p>
          <h3>{{ failedCount }}</h3>
          <small>Butuh follow-up manual</small>
        </div>
        <div class="stat-card">
          <p class="label">Paket aktif</p>
          <h3>{{ activePackageCount }} / {{ packages.length }}</h3>
          <small>Tersedia di katalog</small>
        </div>
      </section>

      <section class="panel-grid">
        <div class="panel card" id="transactions">
          <div class="section-head">
            <div>
              <p class="eyebrow">Transaksi terbaru</p>
              <h3>Alur pembayaran</h3>
            </div>
            <button type="button" class="ghost-btn" @click="fetchAdminData">Refresh</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Member</th>
                  <th>Paket</th>
                  <th>Status</th>
                  <th>Jumlah</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in latestTransactions" :key="tx.id">
                  <td class="mono">{{ tx.orderId }}</td>
                  <td>
                    <div class="stacked">
                      <span>{{ tx.user?.name || '-' }}</span>
                      <small class="muted">{{ tx.user?.email }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="stacked">
                      <span>{{ tx.package?.name || '-' }}</span>
                      <small class="muted">{{ tx.package?.durationDays }} hari</small>
                    </div>
                  </td>
                  <td>
                    <span :class="['status', tx.status]">{{ tx.status }}</span>
                  </td>
                  <td>{{ formatCurrency(tx.amount) }}</td>
                  <td>{{ formatDateTime(tx.createdAt) }}</td>
                </tr>
                <tr v-if="!latestTransactions.length">
                  <td colspan="6" class="muted">Belum ada transaksi.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel card" id="latest-users">
          <div class="section-head">
            <div>
              <p class="eyebrow">Pengguna terbaru</p>
              <h3>Member & admin</h3>
            </div>
          </div>
          <ul class="list">
            <li v-for="user in latestUsers" :key="user.id">
              <div class="avatar">{{ user.name?.charAt(0) || '?' }}</div>
              <div class="stacked">
                <strong>{{ user.name }}</strong>
                <small class="muted">{{ user.email }}</small>
              </div>
              <span class="badge" :class="{ admin: user.roleId === 1 }">
                {{ user.roleId === 1 ? 'Admin' : 'Member' }}
              </span>
            </li>
            <li v-if="!latestUsers.length" class="muted empty-row">Belum ada pengguna.</li>
          </ul>
        </div>
      </section>

      <section class="panel card package-cta">
        <div class="section-head">
          <div>
            <p class="eyebrow">Detail paket</p>
            <h3>Kelola paket lebih rinci</h3>
            <p class="muted">Tambah, edit, nonaktifkan, atau hapus paket di halaman khusus.</p>
          </div>
          <RouterLink to="/admin-packages" class="ghost-btn">Buka halaman paket</RouterLink>
        </div>
      </section>

      <section class="panel card user-cta">
        <div class="section-head">
          <div>
            <p class="eyebrow">Detail pengguna</p>
            <h3>Kelola member & admin</h3>
            <p class="muted">CRUD pengguna tersedia di halaman khusus admin pengguna.</p>
          </div>
          <RouterLink to="/admin-users" class="ghost-btn">Buka halaman pengguna</RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 1rem;
  padding: 1.75rem;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(15, 157, 152, 0.12), transparent 26%);
  pointer-events: none;
}

.hero h1 {
  margin: 0.35rem 0 0.5rem;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0;
  color: var(--muted);
  max-width: 52ch;
}

.hero-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.meta-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  background: var(--surface-alt);
}

.label {
  display: block;
  font-size: 0.88rem;
  color: var(--muted);
}

.hero-user {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.2rem;
  background: var(--surface-alt);
  align-self: flex-start;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: var(--muted);
}

.muted {
  color: var(--muted);
}

.chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.chip {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.9rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.stat-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  background: linear-gradient(135deg, var(--surface), var(--surface-alt));
  box-shadow: var(--shadow);
}

.stat-card h3 {
  margin: 0.25rem 0 0;
}

.stat-card.alt {
  background: linear-gradient(135deg, var(--primary-contrast), var(--surface));
}

.stat-card.warn {
  background: linear-gradient(135deg, rgba(242, 108, 45, 0.08), var(--surface));
}

.panel-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
}

.panel-grid > * {
  min-width: 0;
}

.panel {
  padding: 1rem;
  min-width: 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.ghost-btn {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  box-shadow: none;
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
}

.ghost-btn:hover {
  background: var(--primary-contrast);
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
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

.mono {
  font-family: 'Space Grotesk', monospace;
  font-size: 0.95rem;
}

.stacked {
  display: flex;
  flex-direction: column;
  min-width: 0;
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

.status.pending {
  background: #fff3cd;
  color: #b26b00;
}

.status.failed {
  background: #ffe7e7;
  color: #c62828;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.list-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.list-wrapper .list {
  min-width: 420px;
}

.list li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.35rem;
  border-bottom: 1px solid var(--border);
  min-width: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: var(--primary-contrast);
  color: var(--primary);
}

.badge {
  margin-left: auto;
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.badge.admin {
  background: var(--primary-contrast);
  color: var(--primary);
}

.empty-row {
  text-align: center;
}

.message.error {
  background: #ffe7e7;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 0.9rem 1rem;
  border-radius: 12px;
}

.message.success {
  background: #e9fbf8;
  border: 1px solid #b6ebe2;
  color: #0f766e;
  padding: 0.9rem 1rem;
  border-radius: 12px;
}

.skeleton-layout {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.block {
  height: 160px;
}

.management {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.management-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 1rem;
}

.user-form {
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

.form-field input:read-only {
  background: var(--surface-alt);
}

.form-field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
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

.package-management {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.package-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 1rem;
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

.user-table {
  border: 1px solid var(--border);
  border-radius: 14px;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.table-actions.packages {
  flex-wrap: nowrap;
}

.ghost-btn.danger {
  border-color: #f26c2d;
  color: #f26c2d;
}

@media (max-width: 768px) {
  #latest-users .avatar {
    display: none;
  }

  #latest-users .list li {
    gap: 0.5rem;
    padding-left: 0;
  }
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }

  .management-grid {
    grid-template-columns: 1fr;
  }

  .package-grid {
    grid-template-columns: 1fr;
  }
}
</style>
