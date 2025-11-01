// src/prisma/prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Kita pakai @Injectable() agar service ini bisa di-inject ke service/controller lain
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  // Saat modul ini diinisiasi (app start), kita connect ke DB
  async onModuleInit() {
    await this.$connect();
  }

  // Saat app di-shutdown, kita disconnect dari DB secara graceful
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
