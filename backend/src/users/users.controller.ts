// src/users/users.controller.ts

import {
  Controller,
  Get,
  Req,
  UseGuards,
  Put,
  Body,
  Param, // <-- 1. Import Param
  ParseIntPipe, // <-- 2. Import ParseIntPipe
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse, // <-- 3. Import ApiForbiddenResponse
  ApiNotFoundResponse, // <-- 4. Import ApiNotFoundResponse
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// --- 5. Import dependensi untuk Admin ---
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto'; // <-- DTO baru

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * (Member/Admin) Endpoint untuk mendapatkan profil user yang sedang login
   * GET /users/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard) // <-- Hanya cek token (Authn)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (Member/Admin)' })
  @ApiOkResponse({
    description: 'User profile retrieved successfully.',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  getProfile(@Req() req: Request & { user: UserResponseDto }): UserResponseDto {
    return req.user;
  }

  /**
   * (Member/Admin) Endpoint untuk memperbarui profil user yang sedang login
   * PUT /users/profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard) // <-- Hanya cek token (Authn)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (Member/Admin)' })
  @ApiOkResponse({
    description: 'User profile updated successfully.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  updateProfile(
    @Req() req: Request & { user: UserResponseDto },
    @Body() updateUserDto: UpdateUserDto, // <-- DTO standar
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  // --- ENDPOINT ADMIN BARU ---

  /**
   * (Admin) Mengambil semua user
   * GET /users
   */
  @Get() // <-- GET di root /users
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- 6. Terapkan Authn dan Authz
  @Roles(Role.Admin) // <-- 7. Hanya Admin
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin Only)' })
  @ApiOkResponse({
    description: 'List of all users retrieved.',
    type: [UserResponseDto], // <-- Mengembalikan array UserResponseDto
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  findAllUsers() {
    return this.usersService.findAll();
  }

  /**
   * (Admin) Memperbarui data user spesifik
   * PUT /users/:id
   */
  @Put(':id') // <-- PUT di /users/:id
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- 6. Terapkan Authn dan Authz
  @Roles(Role.Admin) // <-- 7. Hanya Admin
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a specific user (Admin Only)' })
  @ApiOkResponse({
    description: 'User updated successfully.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiNotFoundResponse({ description: 'User not found.' }) // <-- Tambahan
  updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number, // <-- 8. Ambil ID dari URL
    @Body() updateUserAdminDto: UpdateUserAdminDto, // <-- 9. Pakai DTO Admin
  ): Promise<UserResponseDto> {
    return this.usersService.updateByAdmin(id, updateUserAdminDto);
  }
}
