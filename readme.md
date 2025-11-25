# Gym Membership App (NestJS + Vue 3)

Fullstack gym membership platform dengan backend NestJS + Prisma (MySQL) dan frontend Vue 3 + Vite. Aplikasi mendukung pembelian paket via Midtrans, penjadwalan kelas & personal trainer, serta dashboard admin.

## Yang Ada di Proyek Ini
- **Backend**: NestJS 11, Prisma, MySQL, JWT auth + RBAC (Admin/Member), Midtrans Snap (create txn, webhook settlement, refund/void), promo codes, stacking membership, kelas & check-in token, PT schedule/booking, email notifikasi (Nodemailer/Resend-style), Swagger di `/api`, Helmet + rate limit + CORS.
- **Frontend**: Vue 3 + TypeScript + Vite, Pinia, Vue Router, Axios, Snap embed pada halaman paket, halaman member (profil, riwayat transaksi/membership), booking kelas & PT, dashboard admin (paket + promo, user, kelas, transaksi), Trainer dashboard dengan completion flow + workout log.
- **Data model**: Users/Roles, Packages + PromoCode, Transactions, UserMembership (stacking), GymClass + ClassBooking (QR/check-in token), TrainerProfile + availability + PTSession + WorkoutLog, AdminLog, Metrics summary.

## Struktur Repo
- `backend/` — API NestJS, Prisma schema/migrations, seed.
- `frontend/` — SPA Vue 3 + Vite.
- `backend/prisma/migrations/` — migrasi skema; `seed.ts` buat role, admin default, paket contoh.

## Prasyarat
- Node 18+ dan npm.
- MySQL 8 (siapkan DB utama + shadow untuk Prisma `migrate dev`).
- Akun Midtrans (Sandbox) untuk server/client key.
- Opsional: kredensial email (Gmail SMTP atau Resend-style API).

## Setup Backend
1. Buat `backend/.env` (placeholder contoh):
   ```env
   DATABASE_URL="mysql://user:pass@localhost:3306/gymdb"
   SHADOW_DATABASE_URL="mysql://user:pass@localhost:3306/prisma_shadow"
   JWT_SECRET="super-secret"
   MIDTRANS_SERVER_KEY="midtrans-server-key"
   MIDTRANS_CLIENT_KEY="midtrans-client-key"
   MIDTRANS_IS_PRODUCTION=false
   CORS_ORIGINS="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"
   # Email (opsional)
   GMAIL_USER=you@gmail.com
   GMAIL_PASS=app-password
   EMAIL_FROM=you@gmail.com
   RESEND_API_KEY= # jika pakai provider kompatibel Resend
   ```
2. Instal & migrasi:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npx prisma db seed   # role + admin + paket contoh
   npm run start:dev
   ```
3. Buka Swagger: http://localhost:3000/api

## Setup Frontend
1. Buat `frontend/.env`:
   ```env
   VITE_API_BASE_URL="http://localhost:3000"
   VITE_MIDTRANS_CLIENT_KEY="midtrans-client-key"
   ```
2. Jalankan:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Akun Default
- Admin: `admin@example.com` / `Admin123!` (dari seed).
- Member: daftar via `/auth/register` atau tambah manual lewat admin user create.

## Deploy Cepat (server/aaPanel)
- `cd backend && npm install && npx prisma migrate deploy && npm run build` lalu restart service backend.
- `cd frontend && npm install && npm run build` lalu deploy hasil build sesuai setup web server.

## Peta API Ringkas
- Auth: `POST /auth/register`, `POST /auth/login` (JWT bearer).
- User: `GET/PUT /users/profile`; Admin `GET/POST/PUT /admin/users`, `GET /admin/users/:id`.
- Packages & Promo: `GET /packages` (public); Admin `GET/POST/PUT/DELETE /admin/packages`, `POST /admin/promos`, `GET /admin/promos`, `PUT/DELETE /admin/promos/:id`; Member `POST /promos/validate`.
- Transactions & Payments: Member `POST /transactions`, `GET /transactions`; Admin `GET /admin/transactions` (+ `?status & search & pagination`), `GET /admin/transactions/export`, `POST /payments/admin/transactions/:id/refund`; Webhook `POST /payments/notification`; Member sync `POST /payments/sync/:orderId`.
- Memberships: Member `GET /memberships/my-status`; Admin `GET /admin/memberships/user/:id`.
- Classes: Public `GET /classes`; Member `POST /classes/:id/book`, `GET /classes/bookings/me`; Admin CRUD + bookings `GET/POST/PUT/DELETE /admin/classes*`, check-in endpoints; Check-in token `POST /classes/checkin`.
- Trainers/PT: Public `GET /trainers`, `GET /trainers/:id/slots?date=YYYY-MM-DD`; Member `POST /trainers/:id/book`, `GET /trainers/sessions/me`; Admin manage trainer profile `POST /admin/trainers`, `.../update`, `.../delete`, availability `POST /trainers/schedule`; Trainer/Admin tandai sesi `PATCH /trainer/sessions/:id/complete` (status COMPLETED/NOSHOW, notes, workout log exercises + feedback).
- Metrics: `GET /metrics/summary` (ringan untuk landing).

## Catatan Tambahan
- Pembayaran: transaksi dibuat via Midtrans Snap; webhook memvalidasi signature dan mengaktifkan membership (stacking jika ada yang aktif). Refund/void admin menandai transaksi gagal dan mengakhiri membership terkait.
- Keamanan: Helmet + rate limit; CORS dibatasi ke `CORS_ORIGINS`; Prisma exception filter sudah dipasang global.
- Migrations: gunakan `npx prisma migrate dev` untuk dev (butuh shadow DB) dan `npm run prisma:deploy` di server. Migrasi terbaru: `20251124093000_add_workout_log` (tabel WorkoutLog).
- Trainer completion flow: trainer tandai sesi selesai/no-show via dashboard, input notes + workout log (exercises JSON + feedback). WorkoutLog disimpan 1:1 dengan PTSession; no-show menghapus log.
- Frontend: halaman paket memuat Snap sandbox; check-in kelas lewat `/checkin?code=...`; guard router memakai token dari Pinia/localStorage.

