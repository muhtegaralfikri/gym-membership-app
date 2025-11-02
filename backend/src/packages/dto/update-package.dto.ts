// src/packages/dto/update-package.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreatePackageDto } from './create-package.dto';

// UpdatePackageDto akan memiliki semua properti dari CreatePackageDto,
// tapi semuanya bersifat opsional.
export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
