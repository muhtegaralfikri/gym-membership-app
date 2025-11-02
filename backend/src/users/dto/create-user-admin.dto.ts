// src/users/dto/create-user-admin.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from 'src/auth/enums/role.enum';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'admin@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '12345678', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: 'Manual User' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '08123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: Role.Member, // default 2
    description: 'User role (1: Admin, 2: Member)',
    default: Role.Member,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  roleId?: number = Role.Member;
}