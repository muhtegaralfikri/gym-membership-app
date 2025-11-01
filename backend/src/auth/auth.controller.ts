// src/auth/auth.controller.ts

import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// 1. Import decorator baru dan DTO response kita
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto'; // Kita akan buat ini

@ApiTags('Auth') // 2. Grup-kan endpoint ini di bawah tag "Auth"
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint untuk Registrasi User
   * POST /auth/register
   */
  @Post('register')
  // 3. Tambahkan dokumentasi operasi
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User successfully registered.',
    type: UserResponseDto, // <-- Ini DTO response kita
  })
  @ApiConflictResponse({ description: 'Email already exists.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    // Kita panggil service-nya
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint untuk Login User
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(200) // <-- 2. TAMBAHKAN BARIS INI
  // 4. Tambahkan dokumentasi operasi
  @ApiOperation({ summary: 'Log in a user' })
  @ApiOkResponse({
    description: 'User successfully logged in.',
    type: LoginResponseDto, // <-- DTO baru untuk token
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    // Kita panggil service-nya
    return this.authService.login(loginDto);
  }
}
