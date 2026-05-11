import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffRole } from '../../staff/schema/staff.schema';

@Injectable()
export class StaffRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    // Si es Super Admin, tiene acceso a todo
    if (user.role === StaffRole.SUPER_ADMIN) return true;

    return requiredRoles.includes(user.role);
  }
}
