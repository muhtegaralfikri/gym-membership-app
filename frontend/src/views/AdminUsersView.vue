<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

const userActionId = ref<number | null>(null)
const savingUser = ref(false)
const userFormError = ref('')

const emptyUserForm = () => ({
  id: null as number | null,
  name: '',
  email: '',
  phone: '',
  roleId: 2,
  password: '',
  isActive: true,
})

const userForm = ref(emptyUserForm())
const isEditingUser = computed(() => !!userForm.value.id)

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Gagal memuat data pengguna.'
  } finally {
    loading.value = false
  }
}

const startEditUser = (user: AdminUser) => {
  userForm.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    roleId: user.roleId,
    password: '',
    isActive: user.isActive ?? true,
  }
  userFormError.value = ''
  message.value = ''
}

const resetUserForm = () => {
  userForm.value = emptyUserForm()
  userFormError.value = ''
  message.value = ''
  error.value = ''
}

const toggleUserActive = async (user: AdminUser) => {
  userActionId.value = user.id
  userFormError.value = ''
  message.value = ''
  error.value = ''
  try {
    const res = await api.put(`/admin/users/${user.id}`, { isActive: !user.isActive })
    const updated = res?.data || { ...user, isActive: !user.isActive }
    users.value = users.value.map((u) => (u.id === user.id ? { ...u, ...updated } : u))
    message.value = `Status user ${user.name} diperbarui.`
  } catch (err: any) {
    userFormError.value = err?.response?.data?.message || `Gagal mengubah status user ${user.name}.`
  } finally {
    userActionId.value = null
  }
}

const submitUserForm = async () => {
  userFormError.value = ''
  message.value = ''
  error.value = ''
  const payload: any = {
    name: userForm.value.name,
    phone: userForm.value.phone || undefined,
    roleId: userForm.value.roleId || 2,
  }

  if (!userForm.value.name || !userForm.value.email) {
    userFormError.value = 'Nama dan email harus diisi.'
    return
  }

  savingUser.value = true
  try {
    let successMessage = ''
    if (isEditingUser.value) {
      payload.isActive = userForm.value.isActive
      await api.put(`/admin/users/${userForm.value.id}`, payload)
      successMessage = 'Data user diperbarui.'
    } else {
      if (!userForm.value.password || userForm.value.password.length < 8) {
        userFormError.value = 'Password minimal 8 karakter.'
        savingUser.value = false
        return
      }
      await api.post('/admin/users', {
        ...payload,
        email: userForm.value.email,
        password: userForm.value.password,
      })
      successMessage = 'User baru berhasil dibuat.'
    }

    await fetchUsers()
    resetUserForm()
    message.value = successMessage
  } catch (err: any) {
    userFormError.value = err?.response?.data?.message || 'Gagal menyimpan data user.'
  } finally {
    savingUser.value = false
  }
}

const roleLabel = (roleId: number) => (roleId === 1 ? 'Admin' : 'Member')

onMounted(fetchUsers)
</script>

<template>
  <main class="page">
    <header class="section-head">
      <div>
        <div class="pill">Admin • Pengguna</div>
        <h1>Kelola member & admin</h1>
        <p class="sub">Tambah, ubah role, atau nonaktifkan akun.</p>
      </div>
      <button type="button" class="ghost-btn" @click="fetchUsers">Refresh</button>
    </header>

    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="message" class="message success">{{ message }}</div>

    <div v-if="loading" class="skeleton-grid">
      <div class="skeleton card form-skeleton">
        <div class="shimmer line wide"></div>
        <div class="form-skeleton-grid">
          <div v-for="n in 4" :key="`form-${n}`" class="shimmer line block"></div>
          <div class="shimmer line block"></div>
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

    <div v-else class="management-grid">
      <form class="user-form" @submit.prevent="submitUserForm">
        <div class="form-grid">
          <label class="form-field">
            <span>Nama*</span>
            <input v-model="userForm.name" type="text" placeholder="Nama lengkap" required />
          </label>
          <label class="form-field">
            <span>Email*</span>
            <input
              v-model="userForm.email"
              type="email"
              placeholder="email@contoh.com"
              :readonly="isEditingUser"
              required
            />
          </label>
          <label class="form-field">
            <span>Telepon</span>
            <input v-model="userForm.phone" type="tel" placeholder="08xxxxxxxx" />
          </label>
          <label class="form-field">
            <span>Role</span>
            <select v-model.number="userForm.roleId">
              <option :value="1">Admin</option>
              <option :value="2">Member</option>
            </select>
          </label>
          <label v-if="!isEditingUser" class="form-field">
            <span>Password*</span>
            <input
              v-model="userForm.password"
              type="password"
              placeholder="Min. 8 karakter"
              minlength="8"
              required
            />
          </label>
          <label v-else class="form-field checkbox">
            <input v-model="userForm.isActive" type="checkbox" />
            <span>Aktifkan akun</span>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="savingUser">
            {{ savingUser ? 'Menyimpan...' : isEditingUser ? 'Perbarui User' : 'Tambah User' }}
          </button>
          <button type="button" class="ghost-btn" @click="resetUserForm">Reset</button>
        </div>
        <p v-if="userFormError" class="form-error">{{ userFormError }}</p>
      </form>

      <div class="table-wrapper user-table">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td class="mono">{{ user.email }}</td>
              <td>
                <span class="badge" :class="{ admin: user.roleId === 1 }">{{ roleLabel(user.roleId) }}</span>
              </td>
              <td>
                <span :class="['status', user.isActive ? 'success' : 'failed']">
                  {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>{{ formatDateTime(user.createdAt) }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="ghost-btn" @click="startEditUser(user)">Edit</button>
                  <button
                    type="button"
                    class="ghost-btn danger"
                    :disabled="userActionId === user.id"
                    @click="toggleUserActive(user)"
                  >
                    {{ userActionId === user.id ? 'Memproses...' : user.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="6" class="muted">Belum ada data pengguna.</td>
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
  grid-template-columns: 1fr 1.2fr;
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

.management-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
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
.form-field select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
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

.user-table {
  border: 1px solid var(--border);
  border-radius: 14px;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

.badge {
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.badge.admin {
  background: var(--primary-contrast);
  color: var(--primary);
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
  flex-wrap: wrap;
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

  .management-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
