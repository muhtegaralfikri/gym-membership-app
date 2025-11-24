// src/users/dto/update-user-admin.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Role } from 'src/auth/enums/role.enum';

export class UpdateUserAdminDto {
  @ApiProperty({
    example: 'John Doe Updated',
    required: false, // Semua field opsional
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '08987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: false,
    description: 'Deactivate or activate user account',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: Role.Member, // Kita pakai Enum kita (hasilnya 2)
    description: 'Change user role (1: Admin, 2: Member, 3: Trainer)',
    required: false,
  })
  @IsInt()
  @Min(1) // Pastikan ID role valid
  @IsOptional()
  roleId?: number;

  // Kita tidak izinkan admin mengubah email atau password user secara langsung
  // (best practice-nya adalah via "reset password flow")
}
