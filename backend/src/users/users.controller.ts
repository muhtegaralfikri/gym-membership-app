// src/users/users.controller.ts

import { Controller, Get, Req, UseGuards, Put, Body } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // 1. Import Guard
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth, // 2. Import untuk Swagger
  ApiUnauthorizedResponse,
  ApiBadRequestResponse, // 2. Import ini
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  /**
   * Endpoint untuk memperbarui profil user yang sedang login
   * PUT /users/profile
   */
  @Put('profile') // 4. Definisikan sebagai PUT
  @UseGuards(JwtAuthGuard) // 5. Kunci endpoint ini
  @ApiBearerAuth() // 6. Tandai butuh token di Swagger
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    description: 'User profile updated successfully.',
    type: UserResponseDto, // 7. Response-nya adalah user yang sudah di-update
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  updateProfile(
    @Req() req: Request & { user: UserResponseDto }, // 8. Ambil user dari token
    @Body() updateUserDto: UpdateUserDto, // 9. Ambil data baru dari body
  ): Promise<UserResponseDto> {
    // 10. Panggil service-nya
    return this.usersService.update(req.user.id, updateUserDto);
  }
}
