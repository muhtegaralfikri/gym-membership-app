// src/auth/dto/login-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInN1YiI6MSwicm9sZSI6MSwiaWF0IjoxNzMwNzEyNTc5LCJleHAiOjE3MzA3OTg5Nzl9.Y-c_i0j-2E5nBv_D-2E5nBv',
  })
  access_token: string;
}
