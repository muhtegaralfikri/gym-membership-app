// src/packages/packages.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse, // <-- 1. Import
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@ApiTags('Packages')
@Controller() // <-- 2. Ubah @Controller('packages') menjadi @Controller()
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  /**
   * (Publik) Mengambil semua paket yang AKTIF
   * GET /packages
   */
  @Get('packages') // <-- 3. Tambahkan prefix 'packages'
  @ApiOperation({ summary: 'Get all active packages (Public)' })
  @ApiOkResponse({ description: 'List of active packages retrieved.' })
  findAllActive() {
    return this.packagesService.findAllActive();
  }

  // --- ENDPOINT ADMIN (REFACTORED) ---

  /**
   * (Admin) Mengambil SEMUA paket (termasuk non-aktif)
   * GET /admin/packages
   */
  @Get('admin/packages') // <-- 4. Ubah dari @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all packages (Admin Only)' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' }) // <-- Tambahan
  findAll() {
    return this.packagesService.findAll();
  }

  /**
   * (Admin) Membuat paket baru
   * POST /admin/packages
   */
  @Post('admin/packages') // <-- 5. Ubah dari @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new package (Admin Only)' })
  @ApiCreatedResponse({ description: 'Package created successfully.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' }) // <-- Tambahan
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.create(createPackageDto);
  }

  /**
   * (Admin) Memperbarui paket
   * PUT /admin/packages/:id
   */
  @Put('admin/packages/:id') // <-- 6. Ubah dari @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a package (Admin Only)' })
  @ApiOkResponse({ description: 'Package updated successfully.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' }) // <-- Tambahan
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    return this.packagesService.update(id, updatePackageDto);
  }
}