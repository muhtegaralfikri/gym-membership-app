import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Delete,
  Put,
  Query,
  Patch,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateClassDto } from './dto/create-class.dto';
import type { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CheckinDto } from './dto/checkin.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Classes')
@Controller()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('admin/classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: daftar kelas (termasuk arsip)' })
  findAllAdmin(@Query('status') status?: 'upcoming' | 'ongoing' | 'finished') {
    return this.classesService.findAllAdmin(status);
  }

  @Get('classes')
  @ApiOperation({ summary: 'Daftar kelas yang akan datang' })
  findUpcoming() {
    return this.classesService.findUpcoming();
  }

  @Post('admin/classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: buat jadwal kelas' })
  create(
    @Body() dto: CreateClassDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    return this.classesService.createClass(dto, req.user.id);
  }

  @Put('admin/classes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update jadwal kelas' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    return this.classesService.updateClass(id, dto, req.user.id);
  }

  @Delete('admin/classes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: hapus jadwal kelas' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: UserResponseDto }) {
    return this.classesService.deleteClass(id, req.user.id);
  }

  @Get('admin/classes/:id/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: daftar booking per kelas' })
  bookings(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.findClassBookings(id);
  }

  @Patch('admin/classes/bookings/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: batalkan booking kelas' })
  cancelBooking(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.cancelBooking(id);
  }

  @Patch('admin/classes/bookings/:id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: check-in manual booking kelas' })
  checkinBooking(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.forceCheckinBooking(id);
  }

  @Get('classes/bookings/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Booking milik user saat ini' })
  myBookings(@Req() req: Request & { user: UserResponseDto }) {
    return this.classesService.findUserBookings(req.user.id);
  }

  @Post('classes/:id/book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Booking kelas untuk user saat ini' })
  book(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: UserResponseDto }) {
    return this.classesService.bookClass(id, req.user.id);
  }

  @Post('classes/checkin')
  @ApiOperation({ summary: 'Check-in kelas dengan kode QR' })
  checkin(@Body() dto: CheckinDto) {
    return this.classesService.checkinByCode(dto.code);
  }
}
