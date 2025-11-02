// src/users/users.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';
// 1. Import DTO admin yang baru
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 2. Buat helper function agar DRY (Don't Repeat Yourself)
  private excludePassword(user: User): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * (Admin) Membuat user baru secara manual
   */
  async createByAdmin(dto: CreateUserAdminDto): Promise<UserResponseDto> {
    const { roleId, password, ...rest } = dto;

    // 1. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Buat user baru di database
    const newUser = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        role: {
          connect: { id: roleId }, // 3. Hubungkan ke Role ID
        },
      },
    });

    return this.excludePassword(newUser); // Kembalikan DTO yang aman
  }

  /**
   * (Admin) Mengambil detail satu user by ID (tanpa password)
   */
  async findOneById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.excludePassword(user); // Kembalikan DTO yang aman
  }
  /**
   * Method untuk membuat user baru (dipakai saat register)
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const dataWithHashedPassword = {
      ...data,
      password: hashedPassword,
    };

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
   * Method untuk user memperbarui profil MEREKA SENDIRI
   */
  async update(
    id: number,
    data: Prisma.UserUpdateInput, // Ini pakai UpdateUserDto biasa
  ): Promise<UserResponseDto> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.excludePassword(updatedUser); // Pakai helper
  }

  // --- METHOD ADMIN BARU ---

  /**
   * (Admin) Mengambil semua user
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
    // Map setiap user untuk membuang password
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return users.map(this.excludePassword);
  }

  /**
   * (Admin) Memperbarui data user spesifik
   */
  async updateByAdmin(
    id: number,
    dto: UpdateUserAdminDto,
  ): Promise<UserResponseDto> {
    const { roleId, ...rest } = dto;

    // Siapkan data untuk Prisma
    const data: Prisma.UserUpdateInput = {
      ...rest,
    };

    // Jika roleId disertakan, tambahkan koneksi relasi
    if (roleId) {
      data.role = {
        connect: { id: roleId },
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.excludePassword(updatedUser);
  }
}
