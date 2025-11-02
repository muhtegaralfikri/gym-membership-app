// src/auth/dto/register.dto.ts

import { ApiProperty } from '@nestjs/swagger'; // <-- 1. Import
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'member@gmail.com' }) // <-- 2. Tambahkan
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '12345678', minLength: 8 }) // <-- 3. Tambahkan
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: '081234567899',
    required: false, // <-- 2. Tandai opsional di Swagger
  })
  @IsString()
  @IsOptional() // <-- 3. Buat opsional di validasi
  phone?: string;

  @ApiProperty({ example: 'John Doe' }) // <-- 4. Tambahkan
  @IsString()
  @IsNotEmpty()
  name: string;
}
