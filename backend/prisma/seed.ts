// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  // Buat dua role dasar: Admin dan Member
  // Kita pakai upsert agar script ini bisa dijalankan berkali-kali
  // tanpa membuat data duplikat.

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: 1, // Kita tentukan ID-nya
      name: 'admin',
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'member' },
    update: {},
    create: {
      id: 2, // Kita tentukan ID-nya
      name: 'member',
    },
  });

  console.log('Roles created:', { adminRole, memberRole });
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
