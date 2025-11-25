import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CompleteSessionDto } from './dto/complete-session.dto';
import { Prisma } from '@prisma/client';

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
  mySessions(
    @Req() req: Request & { user: UserResponseDto },
    @Query('includePast') includePast?: string,
  ) {
    const withHistory = includePast === 'true';
    return this.trainersService.findMemberSessions(req.user.id, withHistory);
  }

  @Get('trainer/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Trainer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All PT sessions for current trainer' })
  trainerSessions(@Req() req: Request & { user: UserResponseDto }) {
    return this.trainersService.findTrainerSessions(req.user.id);
  }

  @Post('trainer/sessions/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Trainer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark PT session as completed and add notes (Trainer/Admin)' })
  completeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteSessionDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    const allowAdminOverride = req.user.roleId === Role.Admin;
    const exercises = dto.exercises
      ? (dto.exercises as unknown as Prisma.JsonArray)
      : undefined;
    return this.trainersService.completeSession(
      req.user.id,
      id,
      dto.notes,
      dto.status,
      exercises,
      dto.feedback,
      allowAdminOverride,
    );
  }

  @Patch('trainer/sessions/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Trainer, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update PT session status (completed/no-show) with workout log' })
  completeSessionPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteSessionDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    const allowAdminOverride = req.user.roleId === Role.Admin;
    const exercises = dto.exercises
      ? (dto.exercises as unknown as Prisma.JsonArray)
      : undefined;
    return this.trainersService.completeSession(
      req.user.id,
      id,
      dto.notes,
      dto.status,
      exercises,
      dto.feedback,
      allowAdminOverride,
    );
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
  @Roles(Role.Admin, Role.Trainer)
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
