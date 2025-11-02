// src/packages/packages.controller.ts

import {
  Controller,
  Get,
  Post, // <-- 1. Import
  Body, // <-- 1. Import
  Put, // <-- 1. Import
  Param, // <-- 1. Import
  ParseIntPipe, // <-- 1. Import
  UseGuards, // <-- 1. Import
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth, // <-- 2. Import
  ApiCreatedResponse, // <-- 2. Import
  ApiForbiddenResponse, // <-- 2. Import
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // <-- 3. Import
import { RolesGuard } from 'src/auth/guards/roles.guard'; // <-- 3. Import
import { Roles } from 'src/auth/decorators/roles.decorator'; // <-- 3. Import
import { Role } from 'src/auth/enums/role.enum'; // <-- 3. Import
import { CreatePackageDto } from './dto/create-package.dto'; // <-- 3. Import
import { UpdatePackageDto } from './dto/update-package.dto'; // <-- 3. Import

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  /**
   * (Publik) Mengambil semua paket yang AKTIF
   * GET /packages
   */
  @Get()
  @ApiOperation({ summary: 'Get all active packages (Public)' })
  @ApiOkResponse({ description: 'List of active packages retrieved.' })
  findAllActive() {
    return this.packagesService.findAllActive();
  }

  /**
   * (Admin) Mengambil SEMUA paket (termasuk non-aktif)
   * GET /packages/all
   */
  @Get('all') // <-- Endpoint berbeda
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- 4. Terapkan Guard
  @Roles(Role.Admin) // <-- 5. Tentukan Role
  @ApiBearerAuth() // <-- 6. Tandai di Swagger
  @ApiOperation({ summary: 'Get all packages (Admin Only)' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.packagesService.findAll();
  }

  /**
   * (Admin) Membuat paket baru
   * POST /packages
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new package (Admin Only)' })
  @ApiCreatedResponse({ description: 'Package created successfully.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.create(createPackageDto);
  }

  /**
   * (Admin) Memperbarui paket
   * PUT /packages/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a package (Admin Only)' })
  @ApiOkResponse({ description: 'Package updated successfully.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    return this.packagesService.update(id, updatePackageDto);
  }
}
