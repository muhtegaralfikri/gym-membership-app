// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// 1. Import Swagger
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // 2. Konfigurasi Swagger DocumentBuilder
  const config = new DocumentBuilder()
    .setTitle('Gym Membership API')
    .setDescription('API documentation for the Fullstack Gym Membership App')
    .setVersion('1.0')
    .addTag('gym') // Tag opsional
    .addBearerAuth() // <-- TAMBAHKAN BARIS INI
    .build();

  // 3. Buat dokumen Swagger
  const document = SwaggerModule.createDocument(app, config);

  // 4. Setup endpoint untuk Swagger UI
  // Ini berarti UI-nya akan ada di http://localhost:3000/api
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
void bootstrap();
