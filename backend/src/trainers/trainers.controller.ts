import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { BookSessionDto } from './dto/book-session.dto';
import { ScheduleAvailabilityDto } from './dto/schedule-availability.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import type { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@ApiTags('Trainers')
@Controller()
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get('trainers')
  @ApiOperation({ summary: 'List trainers with profiles' })
  findAll() {
    return this.trainersService.findAllTrainers();
  }

  @Get('trainers/:id/slots')
  @ApiOperation({ summary: 'Get available slots for a trainer on a given date' })
  findSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Query parameter "date" is required');
    }
    return this.trainersService.getTrainerAvailability(id, date);
  }

  @Post('trainers/:id/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Member)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a PT session (Member only)' })
  bookSession(
    @Param('id', ParseIntPipe) trainerId: number,
    @Body() dto: BookSessionDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    return this.trainersService.bookSession(
      req.user.id,
      trainerId,
      dto.scheduledAt,
      dto.durationMinutes,
      dto.notes,
    );
  }

  @Get('trainers/sessions/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Member)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upcoming PT sessions for current member' })
  mySessions(@Req() req: Request & { user: UserResponseDto }) {
    return this.trainersService.findMemberSessions(req.user.id);
  }

  @Post('admin/trainers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create trainer profile for an existing user (Admin)' })
  createTrainer(@Body() dto: CreateTrainerDto) {
    return this.trainersService.createTrainerProfile(dto);
  }

  @Post('admin/trainers/:userId/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trainer profile (Admin)' })
  updateTrainer(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateTrainerDto,
  ) {
    return this.trainersService.updateTrainerProfile(userId, dto);
  }

  @Post('admin/trainers/:userId/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete trainer profile (Admin)' })
  deleteTrainer(@Param('userId', ParseIntPipe) userId: number) {
    return this.trainersService.deleteTrainerProfile(userId);
  }

  @Post('trainers/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Member)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set trainer availability (Trainer/Admin)' })
  setAvailability(
    @Body() dto: ScheduleAvailabilityDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    const targetTrainerId = dto.trainerId ?? req.user.id;
    const isAdmin = req.user.roleId === Role.Admin;
    if (!isAdmin && targetTrainerId !== req.user.id) {
      throw new ForbiddenException('Trainers can only manage their own schedule');
    }
    return this.trainersService.setAvailability(targetTrainerId, dto.slots);
  }
}
