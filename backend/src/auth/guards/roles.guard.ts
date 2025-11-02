import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserResponseDto } from 'src/users/dto/user-response.dto'; // <-- 1. Import DTO

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil roles yang dibutuhkan dari decorator @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Jika tidak ada decorator @Roles, endpoint ini publik/tidak dijaga
    if (!requiredRoles) {
      return true;
    }

    // 3. Ambil data user dari request (yang sudah diisi oleh JwtAuthGuard)
    // <-- FIX 1: Berikan tipe eksplisit untuk user
    const { user }: { user: UserResponseDto } = context
      .switchToHttp()
      .getRequest();

    // 4. Validasi
    // <-- FIX 2: Akses .roleId sekarang type-safe
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const hasRole = requiredRoles.some((role) => user?.roleId === role);

    if (!user || !hasRole) {
      // <-- FIX 3: String dipecah ke baris baru
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
