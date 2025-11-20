import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ValidatePromoDto {
  @ApiProperty({ example: 'GYM50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  packageId: number;
}

@ApiTags('Promos')
@Controller()
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create promo code (Admin)' })
  @ApiCreatedResponse({ description: 'Promo created.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  create(@Body() dto: CreatePromoDto) {
    return this.promosService.create(dto);
  }

  @Get('admin/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List promo codes (Admin)' })
  @ApiOkResponse({ description: 'Promo list retrieved.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  findAll() {
    return this.promosService.findAll();
  }

  @Post('promos/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validasi kode promo untuk paket (Member)' })
  @ApiOkResponse({ description: 'Promo valid dan dihitung.' })
  @ApiBadRequestResponse({ description: 'Promo tidak valid.' })
  @ApiNotFoundResponse({ description: 'Promo tidak ditemukan atau paket tidak berlaku.' })
  validate(@Body() dto: ValidatePromoDto) {
    return this.promosService.validateForPackage(dto.code, dto.packageId);
  }

  @Put('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update promo code (Admin)' })
  @ApiOkResponse({ description: 'Promo updated.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiNotFoundResponse({ description: 'Promo not found.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromoDto) {
    return this.promosService.update(id, dto);
  }

  @Delete('admin/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete promo code (Admin)' })
  @ApiOkResponse({ description: 'Promo deleted.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiNotFoundResponse({ description: 'Promo not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promosService.remove(id);
  }
}
