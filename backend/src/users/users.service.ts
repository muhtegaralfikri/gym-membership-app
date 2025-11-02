// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  // 1. Inject PrismaService agar bisa query ke DB
  constructor(private prisma: PrismaService) {}

  /**
   * Method untuk membuat user baru (dipakai saat register)
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    // 2. Hash password sebelum disimpan
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // 3. Ganti password plain text dengan yang sudah di-hash
    const dataWithHashedPassword = {
      ...data,
      password: hashedPassword,
    };

    // 4. Simpan ke database
    return this.prisma.user.create({
      data: dataWithHashedPassword,
    });
  }

  /**
   * Method untuk mencari user berdasarkan email (dipakai saat login)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Method untuk mencari user berdasarkan ID (dipakai oleh JWT Strategy)
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Method untuk memperbarui data user (dipakai oleh profile update)
   */
  // 2. Ubah return type di sini
  async update(
    id: number,
    data: Prisma.UserUpdateInput,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = updatedUser;
    return result; // 'result' sekarang cocok dengan 'UserResponseDto'
  }
}
