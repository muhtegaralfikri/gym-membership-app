import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PackagesModule } from 'src/packages/packages.module';
import { PromosModule } from 'src/promos/promos.module';

@Module({
  imports: [PrismaModule, PackagesModule, PromosModule], // <-- 3. Tambahkan di sini
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
