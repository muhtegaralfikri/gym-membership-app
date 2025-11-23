<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__content">
      <div class="footer__brand">
        <div class="footer__logo">VueNest GYM</div>
        <p class="footer__tagline">Latihan konsisten, hasil maksimal.</p>
      </div>
      <div class="footer__links">
        <h4>Navigasi</h4>
        <RouterLink to="/">Beranda</RouterLink>
        <RouterLink to="/packages">Paket</RouterLink>
        <RouterLink to="/classes">Kelas</RouterLink>
        <RouterLink to="/profile">Profil</RouterLink>
      </div>
      <div class="footer__contact">
        <h4>Butuh bantuan?</h4>
        <a href="mailto:support@vuenestgym.test">support@vuenestgym.test</a>
        <a href="tel:+62123456789">+62 123 4567 89</a>
      </div>
    </div>
    <div class="footer__bottom">© {{ currentYear }} VueNest GYM. Semua hak dilindungi.</div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 2.5rem;
  padding: 2.5rem 0 1.5rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  width: 100%;
}

.footer__content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  align-items: flex-start;
  padding: 0.75rem 0;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.footer__logo {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--text);
}

.footer__tagline {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.footer__links,
.footer__contact {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.footer__links h4,
.footer__contact h4 {
  margin: 0 0 0.35rem;
  color: var(--text);
  font-size: 0.95rem;
}

.footer a {
  color: var(--muted);
}

.footer a:hover {
  color: var(--primary);
}

.footer__bottom {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--muted);
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 640px) {
  .footer__content {
    text-align: center;
    justify-items: center;
  }

  .footer__links,
  .footer__contact {
    align-items: center;
  }
}
</style>
