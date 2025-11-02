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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@ApiTags('Memberships')
@Controller() // <-- 1. Ubah @Controller('memberships') menjadi @Controller()
@ApiBearerAuth() // <-- 2. Kita bisa letakkan ini di level controller
@ApiUnauthorizedResponse({ description: 'Unauthorized.' }) // <-- dan ini juga
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * (Member) Mengambil riwayat membership milik sendiri
   */
  @Get('memberships/my-status') // <-- 3. Tambahkan prefix 'memberships/'
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my membership history (Member/Admin)' })
  @ApiOkResponse({ description: 'Membership history retrieved.' })
  findMyMemberships(@Req() req: Request & { user: UserResponseDto }) {
    const userId = req.user.id;
    return this.membershipsService.findUserMemberships(userId);
  }

  /**
   * (Admin) Mengambil riwayat membership user lain
   */
  @Get('admin/memberships/user/:id') // <-- 4. Ubah path ke 'admin/memberships/user/:id'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get a specific user membership history (Admin Only)',
  })
  @ApiOkResponse({ description: 'Membership history retrieved.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findUserMemberships(@Param('id', ParseIntPipe) id: number) {
    return this.membershipsService.findUserMemberships(id);
  }
}