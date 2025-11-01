// src/prisma/prisma.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], // Daftarkan service-nya
  exports: [PrismaService], // Ekspor service-nya agar bisa dipakai modul lain
})
export class PrismaModule {}
