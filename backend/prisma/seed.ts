// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  // --- Seed Roles ---
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { id: 1, name: 'admin' },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'member' },
    update: {},
    create: { id: 2, name: 'member' },
  });

  console.log('Roles created:', { adminRole, memberRole });

  // --- Seed Admin User (default) ---
  const adminEmail = 'admin@example.com';
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      phone: '0800000000',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('Default admin created:', adminUser.email);

  // --- Seed Packages (BARU) ---
  // Kita buat 3 paket contoh

  const package1 = await prisma.package.upsert({
    where: { name: 'Bronze Member' }, // Kita pakai 'name' sebagai unique key
    update: {},
    create: {
      name: 'Bronze Member',
      description: 'Akses gym standar selama 1 bulan.',
      price: 150000.0,
      durationDays: 30,
      features: JSON.stringify(['Akses ke semua alat', 'Gratis handuk']),
      isActive: true,
    },
  });

  const package2 = await prisma.package.upsert({
    where: { name: 'Silver Member' },
    update: {},
    create: {
      name: 'Silver Member',
      description: 'Akses gym standar selama 3 bulan.',
      price: 400000.0, // Harga diskon
      durationDays: 90,
      features: JSON.stringify([
        'Akses ke semua alat',
        'Gratis handuk',
        '1x Sesi Personal Trainer',
      ]),
      isActive: true,
    },
  });

  const package3 = await prisma.package.upsert({
    where: { name: 'Gold Member' },
    update: {},
    create: {
      name: 'Gold Member',
      description: 'Akses gym selama 1 tahun penuh.',
      price: 1500000.0,
      durationDays: 365,
      features: JSON.stringify([
        'Akses ke semua alat',
        'Gratis handuk & Loker',
        '5x Sesi Personal Trainer',
        'Gratis merchandise',
      ]),
      isActive: true,
    },
  });

  // Paket yang tidak aktif (contoh)
  const packageInactive = await prisma.package.upsert({
    where: { name: 'Promo 7 Hari' },
    update: { isActive: false }, // Pastikan ini false
    create: {
      name: 'Promo 7 Hari',
      description: 'Promo percobaan 7 hari.',
      price: 50000.0,
      durationDays: 7,
      isActive: false, // Paket ini tidak akan tampil di API
    },
  });

  console.log('Packages created:', {
    package1,
    package2,
    package3,
    packageInactive,
  });
}

// Jalankan fungsi main dan tangani error
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Tutup koneksi Prisma
    await prisma.$disconnect();
  });
