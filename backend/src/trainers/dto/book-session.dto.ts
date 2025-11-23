import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class BookSessionDto {
  @ApiProperty({ example: '2025-02-01T09:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ example: 60, required: false, minimum: 15, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes?: number;

  @ApiProperty({ example: 'Focus on shoulders and posture', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
