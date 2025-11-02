// src/users/users.controller.ts

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // 1. Import Guard
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth, // 2. Import untuk Swagger
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users') // 3. Grup-kan di Swagger
@Controller('users') // Endpoint akan diawali /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  /**
   * Endpoint untuk mendapatkan profil user yang sedang login
   * GET /users/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard) // 4. KUNCI ENDPOINT INI!
  @ApiBearerAuth() // 5. Beri tahu Swagger ini butuh Bearer Token
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'User profile retrieved successfully.',
    type: UserResponseDto, // 6. Definisikan response-nya
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  getProfile(@Req() req: Request & { user: UserResponseDto }): UserResponseDto {
    // 7. Ambil 'user' dari object request
    // 'user' ini otomatis diisi oleh JwtStrategy kita
    return req.user;
  }
}
