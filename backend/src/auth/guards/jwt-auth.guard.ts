// src/auth/guards/jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Kosong saja tidak masalah.
  // NestJS akan otomatis mencari 'jwt' strategy (JwtStrategy)
  // yang sudah kita daftarkan di AuthModule.
}
