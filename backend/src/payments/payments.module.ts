import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MembershipsModule } from 'src/memberships/memberships.module';
import { PaymentsCleanupService } from './payments.cleanup.service';

@Module({
  imports: [PrismaModule, MembershipsModule], // <-- 2. Tambahkan di sini
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsCleanupService],
})
export class PaymentsModule {}
