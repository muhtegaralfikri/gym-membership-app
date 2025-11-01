// src/auth/auth.service.ts

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // 1. Inject service yang kita butuhkan
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Logika untuk Registrasi User Baru
   */
  async register(registerDto: RegisterDto) {
    try {
      // 2. Buat user baru menggunakan UsersService
      // UsersService akan otomatis meng-hash password
      const newUser = await this.usersService.create({
        email: registerDto.email,
        name: registerDto.name,
        password: registerDto.password,
        // Kita set default role 'Member' (ID 2)
        // Ini asumsi, kita akan perbaiki nanti
        role: {
          connect: { id: 2 }, // Asumsi ID 2 adalah 'Member'
        },
      });

      // 3. Hapus password sebelum dikembalikan ke client
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = newUser;
      return result;
    } catch (error) {
      // 4. Tangani error jika email sudah ada (Prisma error code P2002)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      // Tangani error lainnya
      console.error(error);
      throw new InternalServerErrorException('Could not create user');
    }
  }

  /**
   * Logika untuk Login User
   */
  async login(loginDto: LoginDto) {
    // 1. Cari user berdasarkan email
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Bandingkan password yang di-input dengan hash di database
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Buat JWT Payload
    const payload = { email: user.email, sub: user.id, role: user.roleId };

    // 4. Kembalikan access_token
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
