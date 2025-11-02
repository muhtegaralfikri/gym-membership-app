// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173', // <-- Izinkan localhost (untuk dev)
      // Nanti kita tambahkan URL Vercel di sini
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

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