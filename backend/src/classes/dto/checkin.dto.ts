import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckinDto {
  @ApiProperty({ example: '42.123456.vYvQngm9GkDoG68y6aX5XJ3hL5u_r22eJd5OyiI3bRk' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
