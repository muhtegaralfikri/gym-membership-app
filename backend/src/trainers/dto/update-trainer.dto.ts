import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateTrainerDto {
  @ApiPropertyOptional({ example: 'Strength & Mobility' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialties?: string;

  @ApiPropertyOptional({ example: 'Fokus pada form, mobility, dan program progresif.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 300000 })
  @IsOptional()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @Min(0)
  rating?: number;
}
