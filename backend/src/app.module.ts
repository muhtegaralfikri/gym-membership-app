import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PackagesModule } from './packages/packages.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- 2. Tambahkan di sini
    PrismaModule,
    AuthModule, // <-- 3. Kita juga akan butuh ini (tambahkan jika belum ada)
    UsersModule,
    PackagesModule,
    TransactionsModule, // <-- 4. Dan ini (tambahkan jika belum ada)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
