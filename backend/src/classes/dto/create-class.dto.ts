import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'HIIT Pagi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Latihan interval berdurasi 45 menit', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Coach Dika', required: false })
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiProperty({ example: 'Studio A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2025-01-20T08:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2025-01-20T08:45:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: 20, default: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
