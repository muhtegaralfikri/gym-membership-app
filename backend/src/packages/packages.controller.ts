// src/packages/packages.controller.ts

import { Controller, Get } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Packages') // 1. Grup-kan di Swagger
@Controller('packages') // 2. Endpoint akan diawali /packages
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  /**
   * Endpoint untuk mengambil semua paket yang aktif (Publik)
   * GET /packages
   */
  @Get() // 3. Ini akan menangani GET request ke /packages
  @ApiOperation({ summary: 'Get all active packages (Public)' })
  @ApiOkResponse({ description: 'List of active packages retrieved.' })
  findAllActive() {
    // 4. Panggil service-nya. Tidak perlu Guard (karena publik)
    return this.packagesService.findAllActive();
  }
}
