## ⏭️ Status & Rencana Selanjutnya

### Status Saat Ini (Backend)

Fondasi *backend* telah selesai dan **alur E2E (End-to-End) utama telah teruji melalui Swagger**:
1.  **Authentication**: `POST /auth/register` dan `POST /auth/login` (JWT) berfungsi.
2.  **Role-Based Access (RBAC)**: `RolesGuard` dan `Role` Enum telah dibuat.
3.  **CRUD Admin (Dasar)**: Admin dapat melihat (`GET /users`), memperbarui (`PUT /users/:id`), dan mengelola paket (`GET /packages/all`, `POST /packages`, `PUT /packages/:id`).
4.  **Alur Pembayaran E2E**:
    * Member dapat membuat transaksi (`POST /transactions`) dan mendapatkan `paymentToken` Midtrans.
    * *Webhook* (`POST /payments/notification`) berhasil menerima notifikasi "settlement".
    * `MembershipsService` berhasil dipanggil, memvalidasi, dan meng-update status transaksi ke `success`.
    * Logika **Stacking Membership** (Active & Upcoming) terbukti **berhasil** saat *webhook* dijalankan kedua kalinya.
    * Member dapat memverifikasi status keanggotaan mereka (`GET /memberships/my-status`).

### Rencana Kerja (Sisa Gaps)

Tugas berikutnya adalah **Refactor** API agar lebih profesional (menggunakan *prefix* `/admin` sesuai rencana) dan melengkapi *endpoint-endpoint* yang hilang dari daftar.

---

### Langkah 1: Refactor URL (Prioritas Utama)

**Tujuan:** Memindahkan semua *endpoint* Admin agar konsisten menggunakan *prefix* `/admin/` sesuai rencana di CSV. Ini adalah *best practice* untuk kerapian dan keamanan API.

1.  **File: `src/users/users.controller.ts`**
    * Ubah `@Controller('users')` menjadi `@Controller()`.
    * Ubah *endpoint* `GET /users` (Admin) menjadi `@Get('admin/users')`.
    * Ubah *endpoint* `PUT /users/:id` (Admin) menjadi `@Put('admin/users/:id')`.
    * Biarkan `GET /users/profile` dan `PUT /users/profile` tetap dengan *prefix* `users/`.

2.  **File: `src/packages/packages.controller.ts`**
    * Ubah `@Controller('packages')` menjadi `@Controller()`.
    * Biarkan *endpoint* publik `GET /packages` tetap.
    * Ubah *endpoint* `GET /packages/all` (Admin) menjadi `@Get('admin/packages')`.
    * Ubah *endpoint* `POST /packages` (Admin) menjadi `@Post('admin/packages')`.
    * Ubah *endpoint* `PUT /packages/:id` (Admin) menjadi `@Put('admin/packages/:id')`.

3.  **File: `src/memberships/memberships.controller.ts`**
    * Ubah `@Controller('memberships')` menjadi `@Controller()`.
    * Biarkan *endpoint* `GET /memberships/my-status` tetap.
    * Ubah *endpoint* `GET /memberships/user/:id` (Admin) menjadi `@Get('admin/memberships/user/:id')`.

---

### Langkah 2: Melengkapi Admin CRUD Users

**Tujuan:** Melengkapi *endpoint* Admin yang hilang di `UsersController` sesuai rencana.

1.  **File: `src/users/dto/create-user-admin.dto.ts` (Baru)**
    * Buat DTO baru yang mengizinkan Admin mengatur `email`, `password`, `name`, `roleId`.
2.  **File: `src/users/users.service.ts`**
    * Buat *method* baru `findOneById(id: number)` untuk mengambil detail satu user (dan `excludePassword`).
    * Manfaatkan *method* `create` yang sudah ada (yang sudah meng-hash password).
3.  **File: `src/users/users.controller.ts`**
    * Buat *endpoint* `POST /admin/users` (dijaga `RolesGuard(Role.Admin)`).
    * Buat *endpoint* `GET /admin/users/:id` (dijaga `RolesGuard(Role.Admin)`).

---

### Langkah 3: Melengkapi Riwayat Transaksi

**Tujuan:** Memberi akses *read-only* riwayat transaksi untuk Member dan Admin.

1.  **File: `src/transactions/transactions.service.ts`**
    * Buat *method* baru `findUserTransactions(userId: number)` (untuk Member).
    * Buat *method* baru `findAllTransactions()` (untuk Admin).
2.  **File: `src/transactions/transactions.controller.ts`**
    * Buat *endpoint* `GET /transactions` (dijaga `JwtAuthGuard`, mengambil `userId` dari token).
    * Buat *endpoint* `GET /admin/transactions` (dijaga `RolesGuard(Role.Admin)`).

---

### Langkah 4: Mulai Pengembangan Frontend

Setelah semua *endpoint* backend di atas selesai dan rapi, kita akan beralih ke folder `/frontend` dan mulai membangun aplikasi Vue.js untuk mengonsumsi API ini.

