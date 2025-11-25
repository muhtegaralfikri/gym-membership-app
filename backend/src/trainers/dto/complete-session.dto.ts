import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PTSessionStatus } from '@prisma/client';

class WorkoutExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  sets?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  reps?: number;

  @ApiProperty({ example: 50, required: false, description: 'Berat dalam kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CompleteSessionDto {
  @ApiProperty({
    example: 'Hari ini fokus deadlift 60kg, teknik hip hinge bagus.',
    required: false,
    maxLength: 1000,
    description: 'Catatan latihan yang akan disimpan ke PTSession.notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    enum: PTSessionStatus,
    required: false,
    description: 'Status akhir sesi, default COMPLETED. Bisa diisi NOSHOW.',
  })
  @IsOptional()
  @IsEnum(PTSessionStatus)
  status?: PTSessionStatus;

  @ApiProperty({
    required: false,
    type: [WorkoutExerciseDto],
    description: 'Daftar latihan yang dilakukan.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseDto)
  exercises?: WorkoutExerciseDto[];

  @ApiProperty({
    required: false,
    description: 'Feedback umum untuk member.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  feedback?: string;
}
