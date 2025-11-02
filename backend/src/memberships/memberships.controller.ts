// src/memberships/memberships.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse, // <-- 1. Import
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@ApiTags('Memberships') // Grup-kan di Swagger
@Controller('memberships')
@UseGuards(JwtAuthGuard) // <-- 2. Terapkan Guard di level Controller
@ApiBearerAuth() // <-- 3. Semua endpoint di sini butuh Token
@ApiUnauthorizedResponse({ description: 'Unauthorized.' }) // <-- 4. Default response
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * (Member) Mengambil riwayat membership milik sendiri
   */
  @Get('my-status')
  @ApiOperation({ summary: 'Get my membership history (Member/Admin)' })
  @ApiOkResponse({ description: 'Membership history retrieved.' })
  findMyMemberships(@Req() req: Request & { user: UserResponseDto }) {
    // Kita ambil 'id' dari user yang sudah login (dari token)
    const userId = req.user.id;
    return this.membershipsService.findUserMemberships(userId);
  }

  /**
   * (Admin) Mengambil riwayat membership user lain
   */
  @Get('user/:id')
  @UseGuards(RolesGuard) // <-- 5. Terapkan RolesGuard tambahan
  @Roles(Role.Admin) // <-- 6. Hanya untuk Admin
  @ApiOperation({
    summary: 'Get a specific user membership history (Admin Only)',
  })
  @ApiOkResponse({ description: 'Membership history retrieved.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findUserMemberships(
    @Param('id', ParseIntPipe) id: number, // <-- Ambil 'id' dari URL
  ) {
    return this.membershipsService.findUserMemberships(id);
  }
}