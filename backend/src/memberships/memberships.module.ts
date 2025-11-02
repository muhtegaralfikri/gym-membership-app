import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PackagesModule } from 'src/packages/packages.module'; // <-- 1. Import

@Module({
  imports: [PrismaModule, PackagesModule], // <-- 2. Tambahkan di sini
  providers: [MembershipsService],
  exports: [MembershipsService], // <-- 3. Ekspor jika akan dipakai di modul lain (misal Webhook)
})
export class MembershipsModule {}
