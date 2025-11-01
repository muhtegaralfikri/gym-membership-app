import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module'; // <-- 1. Import UsersModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule, // <-- 2. Tambahkan di sini
    PassportModule,
    JwtModule.registerAsync({
      // <-- 3. Konfigurasi JwtModule secara dinamis
      imports: [ConfigModule], // Impor ConfigModule
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Baca dari .env
        signOptions: { expiresIn: '1d' }, // Token berlaku 1 hari
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
