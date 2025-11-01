import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. Import di sini

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // <-- 2. Tambahkan baris ini
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
void bootstrap();
