import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff, StaffDocument, StaffRole } from './schema/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';
import * as qrcode from 'qrcode';
import { authenticator } from 'otplib';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
  ) {}

  async create(
    createStaffDto: CreateStaffDto,
    creatorId?: string,
  ): Promise<Staff> {
    const { email, username, password } = createStaffDto;

    // Enforce SUPER_ADMIN uniqueness - only one can exist
    if (createStaffDto.role === StaffRole.SUPER_ADMIN) {
      const existingSuperAdmin = await this.staffModel.findOne({
        role: StaffRole.SUPER_ADMIN,
      });
      if (existingSuperAdmin) {
        throw new BadRequestException(
          'Ya existe un Super Super Admin. Solo puede haber uno en el sistema.',
        );
      }
    }

    const existing = await this.staffModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existing) {
      throw new BadRequestException(
        'Staff with this email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new this.staffModel({
      ...createStaffDto,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      isActive: true,
      lastLogin: null,
      createdBy: creatorId || 'system',
    });

    return newStaff.save();
  }

  async findAll(role?: StaffRole): Promise<Staff[]> {
    const filter = role ? { role } : {};
    return this.staffModel
      .find(filter)
      .select('-password -twoFactorSecret')
      .exec();
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffModel
      .findById(id)
      .select('-password -twoFactorSecret')
      .exec();
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  // Método interno para Auth (devuelve password y secret)
  // Busca por username O email para permitir login con cualquiera de los dos
  async findByUsernameForAuth(usernameOrEmail: string): Promise<StaffDocument | null> {
    const value = usernameOrEmail.toLowerCase();
    return this.staffModel
      .findOne({ $or: [{ username: value }, { email: value }] })
      .select('+password +twoFactorSecret') // Necesario para validar pass y 2FA
      .exec();
  }

  async findByIdForAuth(id: string): Promise<StaffDocument | null> {
    return this.staffModel.findById(id).select('+twoFactorSecret').exec();
  }

  async updateLastLogin(id: string) {
    await this.staffModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async setTwoFactorSecret(id: string, secret: string) {
    return this.staffModel.updateOne({ _id: id }, { twoFactorSecret: secret });
  }

  async enableTwoFactor(id: string) {
    return this.staffModel.updateOne({ _id: id }, { twoFactorEnabled: true });
  }

  async generate2FA(staffId: string) {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) throw new NotFoundException('Staff not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(staff.email, 'Bet Sniper Admin', secret);

    await this.staffModel.updateOne(
      { _id: staffId },
      { twoFactorSecret: secret },
    );

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  async enable2FA(staffId: string, token: string) {
    const staff = await this.staffModel
      .findById(staffId)
      .select('+twoFactorSecret');
    if (!staff || !staff.twoFactorSecret) {
      throw new BadRequestException('Primero debes generar el secreto.');
    }

    const isValid = authenticator.verify({
      token,
      secret: staff.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código incorrecto.');
    }

    await this.staffModel.updateOne(
      { _id: staffId },
      { twoFactorEnabled: true },
    );
    return { success: true };
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const { username, email } = updateStaffDto;

    // Prevent changing role to SUPER_ADMIN if one already exists
    if ((updateStaffDto as any).role === StaffRole.SUPER_ADMIN) {
      const currentStaff = await this.staffModel.findById(id);
      if (currentStaff && currentStaff.role !== StaffRole.SUPER_ADMIN) {
        const existingSuperAdmin = await this.staffModel.findOne({
          role: StaffRole.SUPER_ADMIN,
        });
        if (existingSuperAdmin) {
          throw new BadRequestException(
            'Ya existe un Super Super Admin. Solo puede haber uno en el sistema.',
          );
        }
      }
    }

    // Verificar duplicados si cambian email o username
    if (email || username) {
      const existing = await this.staffModel.findOne({
        $and: [
          { _id: { $ne: id } }, // Excluir el usuario actual
          {
            $or: [
              ...(email ? [{ email: email.toLowerCase() }] : []),
              ...(username ? [{ username: username.toLowerCase() }] : []),
            ],
          },
        ],
      });

      if (existing) {
        throw new BadRequestException(
          'Email or Username is already taken by another staff account.',
        );
      }
    }

    const updatedData: any = { ...updateStaffDto };
    if (email) updatedData.email = email.toLowerCase();
    if (username) updatedData.username = username.toLowerCase();

    const updated = await this.staffModel
      .findByIdAndUpdate(id, updatedData, { new: true })
      .select('-password -twoFactorSecret')
      .exec();
    if (!updated) throw new NotFoundException('Staff not found');
    return updated;
  }

  async changePassword(id: string, password: string): Promise<Staff> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await this.staffModel
      .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
      .select('-password -twoFactorSecret')
      .exec();
    if (!updated) throw new NotFoundException('Staff not found');
    return updated;
  }

  // Seed Super Super Admin - se ejecuta al iniciar la aplicación (idempotente)
  async seedSuperAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'richar@gmail.com';
    const adminUser = process.env.ADMIN_USER || 'superadmin';
    const adminPass = process.env.ADMIN_PASS || 'SuperAdmin2024!';

    // Verificar si ya existe un SUPER_ADMIN
    const existingSuperAdmin = await this.staffModel.findOne({
      role: StaffRole.SUPER_ADMIN,
    });

    if (existingSuperAdmin) {
      console.log(`Super Admin ya existe: ${existingSuperAdmin.email}`);
      return;
    }

    // Verificar si el email o username ya están en uso
    const existingUser = await this.staffModel.findOne({
      $or: [{ email: adminEmail.toLowerCase() }, { username: adminUser.toLowerCase() }],
    });

    if (existingUser) {
      console.log(`Usuario con email ${adminEmail} o username ${adminUser} ya existe. Actualizando rol a SUPER_ADMIN.`);
      await this.staffModel.findByIdAndUpdate(existingUser._id, {
        role: StaffRole.SUPER_ADMIN,
        isActive: true,
      });
      console.log('Rol actualizado a SUPER_ADMIN exitosamente.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const superAdmin = new this.staffModel({
      username: adminUser.toLowerCase(),
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: StaffRole.SUPER_ADMIN,
      isActive: true,
      createdBy: 'system-seed',
    });

    await superAdmin.save();
    console.log(`Super Admin creado exitosamente: ${adminEmail}`);
  }

  /**
   * Check if a SUPER_ADMIN already exists in the system.
   */
  async isSuperAdminExists(): Promise<boolean> {
    const superAdmin = await this.staffModel.findOne({
      role: StaffRole.SUPER_ADMIN,
    });
    return !!superAdmin;
  }
}
