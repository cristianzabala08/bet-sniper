import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import * as qrcode from 'qrcode';
import { authenticator } from 'otplib';

import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async create(data: any): Promise<UserDocument> {
    const created = new this.userModel({
      ...data,
      created: Date.now(),
      lastupdated: Date.now(),
    });
    return created.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findOneById(id: string) {
    const user = await this.userModel.findById(id.trim()).exec();
    return user;
  }

  async findOneByIdWithSecret(id: string) {
    return this.userModel
      .findById(id.trim())
      .select('+twoFactorSecret') // <--- Esto "desbloquea" el campo si tiene select: false
      .exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const users = await this.userModel
      .find()
      .select('-password -twoFactorSecret')
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments();
    return { data: users, total };
  }

  async findOne(username: string) {
    return this.userModel.findOne({ username: username.toLowerCase() });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByWallet(wallet: string) {
    return this.userModel.findOne({ wallet: wallet.toLowerCase() });
  }

  async addReferral(refUsername: string, newUserUsername: string) {
    return this.userModel.updateOne(
      { username: refUsername },
      {
        $inc: { referralsCount: 1 },
        $push: { referrals: newUserUsername },
      },
    );
  }

  async getReferrals(username: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();

    // 1. Contar referidos directos creados este mes
    const monthlyCount = await this.userModel.countDocuments({
      referredBy: username,
      created: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // 2. Contar TODA la red (usando el nuevo método de arriba)
    const { total, active } = await this.countReferralsNetwork(username);

    return {
      referralsCount: user.referralsCount || 0, // Directos (del campo guardado)
      points: user.points || 0,
      referrals: user.referrals || [], // Lista de IDs o nombres directos
      referralsMonth: monthlyCount, // Directos nuevos del mes
      referralsNetwork: total, // Total de la red (multinivel)
      referralsNetworkActive: active, // Total de la red ACTIVA (multinivel)
    };
  }

  // Método auxiliar para contar recursivamente todos los referidos en la red
  private async countReferralsNetwork(
    username: string,
  ): Promise<{ total: number; active: number }> {
    const result = await this.userModel.aggregate([
      { $match: { username: username } },
      {
        $graphLookup: {
          from: 'users', // El nombre de tu colección en MongoDB
          startWith: '$username',
          connectFromField: 'username',
          connectToField: 'referredBy', // Usamos referredBy que es el estándar en el sistema
          as: 'descendants',
        },
      },
      {
        $project: {
          total: { $size: '$descendants' },
          active: {
            $size: {
              $filter: {
                input: '$descendants',
                as: 'd',
                cond: {
                  $and: [
                    { $eq: ['$$d.status', 'active'] },
                    { $gt: ['$$d.membership_expiration', new Date()] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    // Si el usuario existe, retornamos el conteo, si no, 0.
    return result.length > 0
      ? { total: result[0].total, active: result[0].active }
      : { total: 0, active: 0 };
  }

  async setResetToken(userId: string, token: string, expires: Date) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    );
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    );
  }

  async findByResetToken(token: string) {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
  }

  async generate2FA(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 1. Generar secreto
    const secret = authenticator.generateSecret();

    // 2. Generar URL otpauth (Para Google Authenticator/Authy)
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Bet Sniper',
      secret,
    );

    // 3. Guardar secreto temporalmente (sin activar 2FA aún)
    await this.userModel.updateOne(
      { _id: userId },
      { twoFactorSecret: secret },
    );

    // 4. Generar QR para el frontend
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.userModel
      .findById(userId)
      .select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Primero debes generar el secreto.');
    }

    // Validar el código enviado por el usuario
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código incorrecto. Intenta de nuevo.');
    }

    // Activar definitivamente el 2FA
    await this.userModel.updateOne({ _id: userId }, { twoFactorEnabled: true });

    // Enviar correo de alerta
    this.mailService.send2FAEnabledAlert(user.email, user.fullname);

    return { success: true };
  }

  async updateAvatar(userId: string, avatar: string) {
    return this.userModel.updateOne({ _id: userId }, { avatar });
  }

  /**
   * Activa un plan para el usuario, actualizando 'plan' y 'planExpiresAt'.
   */
  async activatePlan(
    userId: string,
    planName: string,
    durationDays: number,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const now = new Date();
    let newExpiration: Date;

    // LÓGICA DE SUMA DE TIEMPO (Acumulativa)
    // Si el usuario tiene una membresía activa y aún no ha vencido
    if (
      user.membership_expiration &&
      new Date(user.membership_expiration) > now
    ) {
      // Sumamos la duración al tiempo que ya tenía
      newExpiration = new Date(user.membership_expiration);
      newExpiration.setDate(newExpiration.getDate() + durationDays);
      console.log(
        `[activatePlan] 🔄 Extending plan '${user.plan}' by ${durationDays} days. New Exp: ${newExpiration}`,
      );
    } else {
      // Si ya venció o es nuevo, la fecha inicia desde hoy
      newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + durationDays);
      console.log(
        `[activatePlan] ✨ New/Expired plan. Starting '${planName}' for ${durationDays} days. Exp: ${newExpiration}`,
      );
    }

    // Actualizar el usuario
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        plan: planName, // 'BASIC', 'AMATEUR', etc.
        membership_expiration: newExpiration,
        status: 'active',
        // Es vital actualizar esto para que la lógica de comisiones
        // detecte el nuevo límite de niveles
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updatedUser;
  }

  /**
   * Verifica si la membresía del usuario está activa.
   */
  async isMembershipActive(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return (
      user.status === 'active' &&
      new Date(user.membership_expiration) > new Date()
    );
  }

  /**
   * Incrementa el contador de referidos directos del sponsor.
   */
  async incrementDirectReferrals(sponsorId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(sponsorId, {
      $inc: { direct_referrals_count: 1 },
    });
  }

  /**
   * Configura la dirección de wallet del usuario.
   */
  async setWalletAddress(userId: string, walletAddress: string): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { wallet_address: walletAddress },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updatedUser;
  }

  /**
   * Obtiene el árbol de referidos con lógica de niveles y activación.
   */
  async getReferralTreeWithLevels(username: string) {
    const rootUser = await this.userModel.findOne({ username });
    if (!rootUser) return [];

    const tree = await this.userModel.aggregate([
      { $match: { username: username } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$username',
          connectFromField: 'username',
          connectToField: 'referredBy',
          as: 'network',
          maxDepth: 5, // Hasta nivel 6
          depthField: 'level',
        },
      },
      { $unwind: '$network' },
      {
        $project: {
          _id: 0,
          username: '$network.username',
          fullname: '$network.fullname',
          email: '$network.email',
          level: { $add: ['$network.level', 1] },
          referralsCount: '$network.referralsCount',
          membership_expiration: '$network.membership_expiration',
          isActive: {
            $and: [
              { $ne: ['$network.plan', 'none'] },
              { $gt: ['$network.membership_expiration', new Date()] },
            ],
          },
          referredBy: '$network.referredBy',
        },
      },
      { $sort: { level: 1, username: 1 } },
    ]);

    return tree;
  }

  /**
   * Obtiene el número de referidos directos de un usuario.
   */
  async getDirectReferralsCount(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    return user ? user.direct_referrals_count : 0;
  }

  /**
   * Actualiza el wallet del usuario.
   */
  async includeWallet(userId: string, wallet: string): Promise<User> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.wallet && user.wallet.toLowerCase() !== wallet.toLowerCase()) {
      throw new BadRequestException(
        `User already has a registered wallet: ${user.wallet}. Please connect your wallet.`,
      );
    }

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { wallet: wallet.toLowerCase().trim() },
        { new: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Enviar correo de alerta
      this.mailService.sendWalletUpdateAlert(
        updatedUser.email,
        updatedUser.fullname,
        wallet,
      );

      return updatedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          'Ese wallet ya está registrado por otro usuario',
        );
      }
      throw error;
    }
  }

  /**
   * Actualiza los puntos del usuario (puede ser positivo o negativo)
   */
  async updatePoints(userId: string, amount: number): Promise<User> {
    // 1. Definimos el filtro básico
    const filter: any = { _id: userId };

    // 2. Si es una resta, añadimos la condición atómica a la consulta
    // Solo se actualizará si los puntos actuales son mayores o iguales al monto a restar
    if (amount < 0) {
      filter.points = { $gte: Math.abs(amount) };
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      filter,
      { $inc: { points: amount } },
      { new: true },
    );

    // 3. Manejo inteligente de errores
    if (!updatedUser) {
      // Si no se actualizó, verificamos si fue porque el usuario no existe
      // o porque no tenía saldo suficiente para cumplir el filtro $gte
      const userExists = await this.userModel.exists({ _id: userId });

      if (!userExists) {
        throw new NotFoundException('USER_NOT_FOUND');
      } else {
        throw new BadRequestException('INSUFFICIENT_FUNDS');
      }
    }

    return updatedUser;
  }

  async validateTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel
      .findById(userId)
      .select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) return false;

    return authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });
  }

  async updateLoginSessionId(userId: string, sessionId: string) {
    return this.userModel.updateOne(
      { _id: userId },
      { loginSessionId: sessionId },
    );
  }

  async setEmailVerificationCode(userId: string, code: string, expires: Date) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        emailVerificationCode: code,
        emailVerificationExpires: expires,
      },
    );
  }

  async markEmailAsVerified(userId: string) {
    return this.userModel.updateOne(
      { _id: userId },
      {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    );
  }
  // 🔥 ADMIN METHODS

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    await this.userModel.findByIdAndDelete(userId);
    return { success: true, message: 'Usuario borrado exitosamente' };
  }

  async blockUnblockUser(userId: string, activated: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.activated = activated;
    return user.save();
  }

  async updateUserAdmin(userId: string, data: UpdateUserAdminDto) {
    // 1. Validar que el usuario exista
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 2. Normalización de datos
    if (data.username) data.username = data.username.toLowerCase().trim();
    if (data.email) data.email = data.email.toLowerCase().trim();
    if (data.wallet) data.wallet = data.wallet.toLowerCase().trim();

    // 3. Validar unicidad de username si se está cambiando
    if (data.username && data.username !== user.username) {
      const exists = await this.userModel.findOne({ username: data.username });
      if (exists) {
        throw new BadRequestException('El nombre de usuario ya está en uso');
      }
    }

    // 4. Validar unicidad de email si se está cambiando
    if (data.email && data.email !== user.email) {
      const exists = await this.userModel.findOne({ email: data.email });
      if (exists) {
        throw new BadRequestException('El correo electrónico ya está en uso');
      }
    }

    // 5. Validar unicidad de wallet si se está cambiando/agregando
    if (data.wallet && data.wallet !== user.wallet) {
      const exists = await this.userModel.findOne({ wallet: data.wallet });
      if (exists) {
        throw new BadRequestException(
          'La wallet ya está registrada por otro usuario',
        );
      }
    }

    // 6. Actualizar campos
    // Usamos Object.assign o propagación, pero mongoose recomienda set
    // Mongoose Model.findByIdAndUpdate es más directo si ya validamos
    return this.userModel.findByIdAndUpdate(userId, data, { new: true });
  }

  async checkEmailAvailability(id: string | undefined, email: string) {
    const emailLower = email.toLowerCase().trim();
    const existingUser = await this.userModel.findOne({ email: emailLower });

    if (existingUser) {
      // Si el id es proporcionado (edición), verificamos si el email pertenece a otro usuario
      if (id && existingUser._id.toString() !== id) {
        return {
          available: false,
          message: 'El correo ya está en uso por otro usuario.',
        };
      }
      // Si no hay id (creación), y encontramos un usuario, no está disponible
      if (!id) {
        return { available: false, message: 'El correo ya está registrado.' };
      }
    }

    return { available: true };
  }

  async adminChangePassword(userId: string, password: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    // Resetear tokens de recuperación si existieran, por seguridad
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    return user.save();
  }

  async adminReset2FA(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;

    return user.save();
  }
}
