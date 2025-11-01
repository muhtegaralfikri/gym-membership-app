// src/auth/dto/login.dto.ts

import { ApiProperty } from '@nestjs/swagger'; // <-- 1. Import
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' }) // <-- 2. Tambahkan
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' }) // <-- 3. Tambahkan
  @IsString()
  @IsNotEmpty()
  password: string;
}
