<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'

type PaymentStatus = 'pending' | 'success' | 'failed'

interface AdminTransaction {
  id: number
  orderId: string
  status: PaymentStatus
  amount: number | string
  createdAt: string
  user?: { name?: string; email?: string }
  package?: { name?: string }
}

const transactions = ref<AdminTransaction[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const statusFilter = ref<'all' | PaymentStatus>('all')
const search = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

const fetchTransactions = async () => {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, any> = {
      page: page.value,
      limit: limit.value,
    }
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (search.value) params.search = search.value
    const res = await api.get('/admin/transactions', { params })
    transactions.value = res.data.data
    total.value = res.data.total
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat transaksi.'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'number' ? value : Number(value || 0)
  return `Rp${num.toLocaleString('id-ID')}`
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const exportCsv = async () => {
  try {
    const params: Record<string, any> = {}
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (search.value) params.search = search.value
    const res = await api.get('/admin/transactions/export', {
      params,
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'transactions.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal mengekspor CSV.'
  }
}

watch([statusFilter, search, limit], () => {
  page.value = 1
  fetchTransactions()
})

onMounted(fetchTransactions)
</script>

<template>
  <main class="page">
    <div class="section-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h2>Transaksi</h2>
        <p class="muted">Filter, pantau status pembayaran, dan unduh CSV.</p>
      </div>
      <div class="actions">
        <select v-model="statusFilter">
          <option value="all">Semua status</option>
          <option value="success">Berhasil</option>
          <option value="pending">Pending</option>
          <option value="failed">Gagal</option>
        </select>
        <input v-model="search" type="search" placeholder="Cari order ID / email" />
        <button type="button" class="ghost-btn" @click="exportCsv">Ekspor CSV</button>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>

    <div class="card table-card">
      <div v-if="loading" class="skeleton-list">
        <div class="shimmer line wide"></div>
        <div class="shimmer line mid"></div>
        <div class="shimmer line"></div>
      </div>
      <div v-else>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Order</th>
                <th>Member</th>
                <th>Paket</th>
                <th>Status</th>
                <th>Jumlah</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tx, idx) in transactions" :key="tx.id">
                <td class="mono">{{ (page - 1) * limit + idx + 1 }}</td>
                <td class="mono">{{ tx.orderId }}</td>
                <td>
                  <div class="stacked">
                    <strong>{{ tx.user?.name || '-' }}</strong>
                    <small class="muted">{{ tx.user?.email || '-' }}</small>
                  </div>
                </td>
                <td>{{ tx.package?.name || '-' }}</td>
                <td><span :class="['status', tx.status]">{{ tx.status }}</span></td>
                <td>{{ formatCurrency(tx.amount) }}</td>
                <td>{{ formatDateTime(tx.createdAt) }}</td>
              </tr>
              <tr v-if="!transactions.length">
                <td colspan="7" class="muted center">Belum ada transaksi.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button type="button" class="ghost-btn" :disabled="page === 1" @click="() => { page--; fetchTransactions() }">
            Prev
          </button>
          <span>Halaman {{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="ghost-btn"
            :disabled="page >= totalPages"
            @click="() => { page++; fetchTransactions() }"
          >
            Next
          </button>
          <label>
            <span>Baris</span>
            <select v-model.number="limit">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </label>
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
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.actions select,
.actions input {
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
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
.card {
  padding: 1rem;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.6rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
th {
  font-size: 0.9rem;
  color: var(--muted);
}
.mono {
  font-family: 'Space Grotesk', monospace;
}
.stacked {
  display: flex;
  flex-direction: column;
}
.status {
  padding: 0.25rem 0.55rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-weight: 700;
  text-transform: capitalize;
}
.status.success {
  background: #e7fff6;
  color: #0f9d98;
}
.status.pending {
  background: #fff3cd;
  color: #b26b00;
}
.status.failed {
  background: #ffe7e7;
  color: #c62828;
}
.alert.error {
  background: #ffe7e7;
  border: 1px solid #ffcdd2;
  padding: 0.85rem 1rem;
  border-radius: 12px;
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
.pagination {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding-top: 0.75rem;
  flex-wrap: wrap;
}
.pagination select {
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.center {
  text-align: center;
}
@media (max-width: 860px) {
  th:nth-child(6),
  td:nth-child(6) {
    display: none;
  }
}
</style>
