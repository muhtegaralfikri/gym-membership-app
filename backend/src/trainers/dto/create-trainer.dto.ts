import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({ example: 10, description: 'User ID yang akan dijadikan trainer' })
  @IsInt()
  userId!: number;

  @ApiProperty({ example: 'Strength & HIIT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  specialties!: string;

  @ApiProperty({ example: 'Fokus koreksi form dan power untuk pemula.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  bio!: string;

  @ApiProperty({ example: 250000, required: false, description: 'Tarif tambahan (opsional)' })
  @IsOptional()
  @Min(0)
  rate?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @Min(0)
  rating?: number;
}
