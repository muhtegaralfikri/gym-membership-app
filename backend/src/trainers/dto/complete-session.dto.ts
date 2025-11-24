import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
