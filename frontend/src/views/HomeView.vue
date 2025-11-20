<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const primaryCta = computed(() => (auth.isAuthenticated ? '/profile' : '/login'))
const primaryLabel = computed(() => (auth.isAuthenticated ? 'Lihat Profil' : 'Mulai Login'))
const registerCta = computed(() => (auth.isAuthenticated ? '/profile' : '/register'))
const registerLabel = computed(() => (auth.isAuthenticated ? 'Lihat Profil' : 'Daftar'))
</script>

<template>
  <div class="home">
    <section class="hero card">
      <div class="hero-copy">
        <div class="pill">VuNest Gym</div>
        <h1>Tempat latihan yang sinkron dengan hidupmu.</h1>
        <p class="sub">
          Pilih paket, bayar dengan Midtrans, dan pantau membership tanpa ribet. Jadwal, pembayaran,
          dan status selalu up-to-date.
        </p>
        <div class="cta">
          <RouterLink class="solid" :to="primaryCta">{{ primaryLabel }}</RouterLink>
          <RouterLink class="ghost" to="/packages">Lihat Paket</RouterLink>
        </div>
        <div class="trust">
          <span>Sudah dipakai instruktur & member aktif</span>
          <div class="avatars">
            <div class="avatar">A</div>
            <div class="avatar">B</div>
            <div class="avatar">C</div>
            <div class="avatar more">+24</div>
          </div>
        </div>
      </div>
      <div class="hero-panels">
        <div class="panel">
          <span class="label">Status Membership</span>
          <strong>Aktif • 27 hari</strong>
          <small>Pembaruan otomatis setelah pembayaran berhasil.</small>
        </div>
        <div class="panel alt">
          <span class="label">Metode Bayar</span>
          <div class="chips">
            <span>VA Bank</span>
            <span>QRIS</span>
            <span>e-Wallet</span>
            <span>Kartu</span>
          </div>
          <small>Dari Midtrans Snap Sandbox/Prod.</small>
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="feature card">
        <h3>Membership real-time</h3>
        <p>Aktivasi otomatis usai status settlement/capture accept, lengkap dengan stacking masa berlaku.</p>
      </div>
      <div class="feature card">
        <h3>Pembayaran aman</h3>
        <p>Snap Midtrans dengan berbagai metode. Notifikasi webhook memvalidasi transaksi dan fraud status.</p>
      </div>
      <div class="feature card">
        <h3>Monitor mudah</h3>
        <p>Profil menampilkan paket aktif, tanggal mulai/akhir, dan riwayat pembelian.</p>
      </div>
    </section>

    <section class="cta-strip card">
      <div>
        <p class="eyebrow">Mulai sekarang</p>
        <h3>Siap latihan lebih konsisten?</h3>
        <p class="sub">Daftar akun atau langsung cek paket membership yang cocok.</p>
      </div>
      <div class="cta actions">
        <RouterLink class="solid" :to="registerCta">{{ registerLabel }}</RouterLink>
        <RouterLink class="ghost" to="/packages">Lihat Paket</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.25rem;
  padding: 2.25rem;
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 10%, rgba(242, 108, 45, 0.12), transparent 26%);
  pointer-events: none;
}
.hero-copy h1 {
  margin: 0.4rem 0 0.5rem;
  letter-spacing: -0.02em;
  font-size: 2.35rem;
}
.sub {
  margin: 0;
  color: var(--muted);
  max-width: 52ch;
}
.cta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
}
.solid,
.ghost {
  border-radius: 12px;
  padding: 0.75rem 1.1rem;
  font-weight: 700;
  border: 1px solid var(--border);
}
.solid {
  background: linear-gradient(120deg, var(--primary), var(--primary-alt));
  color: #fff;
}
.ghost {
  background: var(--surface-alt);
  color: var(--text);
}
.solid:hover {
  filter: brightness(0.95);
}
.ghost:hover {
  background: var(--primary-contrast);
  color: var(--primary);
}
.trust {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.avatars {
  display: flex;
  gap: 0.35rem;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-contrast);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-weight: 700;
  border: 1px solid var(--border);
}
.avatar.more {
  background: var(--surface-alt);
  color: var(--muted);
}
.hero-panels {
  display: grid;
  gap: 0.75rem;
  position: relative;
}
.panel {
  padding: 1.1rem 1rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-alt);
  box-shadow: var(--shadow);
}
.panel.alt {
  background: linear-gradient(135deg, var(--primary-contrast), #fff);
}
.panel .label {
  display: block;
  color: var(--muted);
}
.panel strong {
  display: block;
  margin: 0.2rem 0;
  font-size: 1.2rem;
}
.chips {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin: 0.35rem 0;
}
.chips span {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-weight: 600;
  font-size: 0.9rem;
}
.panel + .panel {
  margin-top: 0.25rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}
.feature {
  padding: 1.35rem;
  min-height: 180px;
}
.feature h3 {
  margin: 0 0 0.3rem;
}
.feature p {
  margin: 0;
  color: var(--muted);
}
.cta-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0;
}
.cta-strip h3 {
  margin: 0.25rem 0 0.35rem;
}
.actions {
  margin-top: 0.35rem;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .cta-strip {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .hero-copy h1 {
    font-size: 1.8rem;
  }
  .cta-strip {
    gap: 0.75rem;
  }
}
</style>
