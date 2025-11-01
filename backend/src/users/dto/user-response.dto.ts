// src/users/dto/user-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ example: '+628123456789', nullable: true })
  phone: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 2 })
  roleId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Perhatikan: Tidak ada 'password' di DTO response ini.
}
