// src/auth/auth.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Ini berarti semua endpoint di sini diawali '/auth'
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint untuk Registrasi User
   * POST /auth/register
   */
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    // Kita panggil service-nya
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint untuk Login User
   * POST /auth/login
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    // Kita panggil service-nya
    return this.authService.login(loginDto);
  }
}
