// src/users/dto/update-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe Updated',
    required: false, // Penting: semua field di update harus opsional
  })
  @IsString()
  @IsOptional() // User boleh update nama saja, atau phone saja
  name?: string;

  @ApiProperty({
    example: '08987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  // Kita tidak izinkan update email, password, atau role via endpoint ini.
}
