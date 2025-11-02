// src/users/users.controller.ts

import {
  Controller,
  Get,
  Req,
  UseGuards,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Post,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse, // <-- 2. Import ApiCreatedResponse
  ApiConflictResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto'; // <-- 4. Import DTO baru

@ApiTags('Users')
@Controller() // <-- 1. Ubah @Controller('users') menjadi @Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * (Member/Admin) Endpoint untuk mendapatkan profil user yang sedang login
   * GET /users/profile
   */
  @Get('users/profile') // <-- 2. Tambahkan prefix 'users/'
  @UseGuards(JwtAuthGuard)
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
  @Put('users/profile') // <-- 3. Tambahkan prefix 'users/'
  @UseGuards(JwtAuthGuard)
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
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  // --- ENDPOINT ADMIN (REFACTORED) ---

  /**
   * (Admin) Mengambil semua user
   * GET /admin/users
   */
  @Get('admin/users') // <-- 4. Ubah dari @Get() menjadi @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin Only)' })
  @ApiOkResponse({
    description: 'List of all users retrieved.',
    type: [UserResponseDto],
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  findAllUsers() {
    return this.usersService.findAll();
  }

  @Post('admin/users') // <-- 5. ENDPOINT BARU
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user manually (Admin Only)' })
  @ApiCreatedResponse({
    description: 'User created successfully.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  createUserByAdmin(@Body() createUserAdminDto: CreateUserAdminDto) {
    // Kita perlu menambahkan try-catch di service untuk P2002 (Conflict)
    // Tapi untuk controller, kita panggil servicenya saja
    return this.usersService.createByAdmin(createUserAdminDto);
  }

  @Get('admin/users/:id') // <-- 6. ENDPOINT BARU
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details for a specific user (Admin Only)' })
  @ApiOkResponse({
    description: 'User details retrieved.',
    type: UserResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }
  /**
   * (Admin) Memperbarui data user spesifik
   * PUT /admin/users/:id
   */
  @Put('admin/users/:id') // <-- 5. Ubah dari @Put(':id') menjadi @Put('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a specific user (Admin Only)' })
  @ApiOkResponse({
    description: 'User updated successfully.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserAdminDto: UpdateUserAdminDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateByAdmin(id, updateUserAdminDto);
  }
}