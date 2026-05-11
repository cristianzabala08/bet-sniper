import { SetMetadata } from '@nestjs/common';
import { StaffRole } from '../../staff/schema/staff.schema';

export const Roles = (...roles: StaffRole[]) => SetMetadata('roles', roles);
