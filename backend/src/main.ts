// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://gym-membership-app-lake.vercel.app',
      'https://www.vuenest.my.id'// <-- Izinkan localhost (untuk dev)
      // Nanti kita tambahkan URL Vercel di sini
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new PrismaExceptionFilter());

  // ... (Swagger config tidak berubah)
  const config = new DocumentBuilder()
    .setTitle('Gym Membership API')
    .setDescription('API documentation for the Fullstack Gym Membership App')
    .setVersion('1.0')
    .addTag('gym')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // --- INI PERUBAHANNYA ---
  // Ambil port dari environment variable, atau default ke 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`); // <-- Tambahan log
  // --- BATAS PERUBAHAN ---
}
void bootstrap();
