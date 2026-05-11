import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schema/plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UsersService } from '../users/users.service';
import { StaffRole } from '../staff/schema/staff.schema';
import { ForcePlanAction } from './dto/force-plan-action.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new plan. Enforces role-based restrictions:
   * - Only SUPER_ADMIN can create plans with durationDays > 1
   * - Regular admins can only create trial plans (1 day max)
   */
  async create(createPlanDto: CreatePlanDto, staffRole: string, staffId: string): Promise<Plan> {
    // Role-based restriction: non-super-admins can only create 1-day trial plans
    if (staffRole !== StaffRole.SUPER_ADMIN && createPlanDto.durationDays > 1) {
      throw new ForbiddenException(
        'Solo el Super Super Admin puede crear planes con duración mayor a 1 día.',
      );
    }

    const existing = await this.planModel.findOne({ name: createPlanDto.name.toUpperCase() });
    if (existing) {
      throw new BadRequestException(`Ya existe un plan con el nombre "${createPlanDto.name}".`);
    }

    const plan = new this.planModel({
      ...createPlanDto,
      name: createPlanDto.name.toUpperCase(),
      createdBy: staffId,
    });

    return plan.save();
  }

  async findAll(includeInactive = false): Promise<Plan[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return this.planModel.find(filter).sort({ sortOrder: 1 }).exec();
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }

  async findByName(name: string): Promise<Plan> {
    const plan = await this.planModel.findOne({ name: name.toUpperCase() }).exec();
    if (!plan) throw new NotFoundException(`Plan "${name}" no encontrado`);
    return plan;
  }

  /**
   * Update a plan. Enforces role-based restrictions:
   * - Only SUPER_ADMIN can set durationDays > 1
   */
  async update(id: string, updatePlanDto: UpdatePlanDto, staffRole: string): Promise<Plan> {
    if (staffRole !== StaffRole.SUPER_ADMIN && updatePlanDto.durationDays && updatePlanDto.durationDays > 1) {
      throw new ForbiddenException(
        'Solo el Super Super Admin puede establecer duración mayor a 1 día.',
      );
    }

    if (updatePlanDto.name) {
      updatePlanDto.name = updatePlanDto.name.toUpperCase();
    }

    const updated = await this.planModel
      .findByIdAndUpdate(id, updatePlanDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Plan no encontrado');
    return updated;
  }

  async remove(id: string): Promise<Plan> {
    const deleted = await this.planModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Plan no encontrado');
    return deleted;
  }

  /**
   * Assign a plan to a user. Creates the membership with the plan's duration.
   */
  async assignPlanToUser(planId: string, userId: string): Promise<any> {
    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!plan.isActive) throw new BadRequestException('El plan no está activo');

    const updatedUser = await this.usersService.activatePlan(
      userId,
      plan.name,
      plan.durationDays,
    );

    return {
      message: `Plan "${plan.displayName}" asignado exitosamente`,
      user: updatedUser,
      plan: {
        name: plan.name,
        durationDays: plan.durationDays,
      },
    };
  }

  /**
   * Force activate or expire a user's plan.
   */
  async forcePlanAction(userId: string, action: ForcePlanAction): Promise<any> {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (action === ForcePlanAction.ACTIVATE) {
      // Force activate: set status to active and extend expiration by 30 days if expired
      const now = new Date();
      let newExpiration: Date;

      if (user.membership_expiration && new Date(user.membership_expiration) > now) {
        newExpiration = new Date(user.membership_expiration);
      } else {
        newExpiration = new Date();
        newExpiration.setDate(newExpiration.getDate() + 30);
      }

      const updatedUser = await this.usersService.activatePlan(
        userId,
        user.plan || 'BASIC',
        0, // We'll handle expiration manually
      );

      return {
        message: 'Plan activado forzosamente',
        user: updatedUser,
      };
    } else if (action === ForcePlanAction.EXPIRE) {
      // Force expire: set status to expired and membership_expiration to past
      const UserModel = (this.usersService as any).userModel;
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          status: 'expired',
          membership_expiration: new Date(0), // Epoch - expired
        },
        { new: true },
      );

      return {
        message: 'Plan expirado forzosamente',
        user: updatedUser,
      };
    }
  }
}
