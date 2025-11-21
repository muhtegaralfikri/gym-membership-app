import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateClassDto } from './dto/create-class.dto';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CheckinDto } from './dto/checkin.dto';

@ApiTags('Classes')
@Controller()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

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
  create(@Body() dto: CreateClassDto) {
    return this.classesService.createClass(dto);
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
