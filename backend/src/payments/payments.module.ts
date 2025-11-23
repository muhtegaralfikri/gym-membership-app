import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MembershipsModule } from 'src/memberships/memberships.module';
import { PaymentsCleanupService } from './payments.cleanup.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, MembershipsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsCleanupService],
})
export class PaymentsModule {}
