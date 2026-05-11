import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullname: string;

  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({
    type: String,
    // Eliminamos unique: true de aquí
    index: {
      unique: true,
      // Este filtro le dice a MongoDB:
      // "Solo aplica la unicidad si el campo wallet existe y es un string"
      partialFilterExpression: { wallet: { $type: 'string' } },
    },
    required: false,
    // Eliminamos el default: null para que sea 'undefined' si no se envía
  })
  wallet?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  created: number;

  @Prop({ default: 0 })
  lastupdated: number;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop({ default: 0 })
  lockUntil: number;

  @Prop({ default: true })
  activated: boolean;

  @Prop({
    type: String,
    enum: ['NONE', 'WEEKLY', 'BASIC', 'AMATEUR', 'PRO', 'EXPERT', 'ELITE'],
    default: 'NONE',
  })
  plan: string;

  @Prop({ type: String, default: null })
  referredBy: string | null;

  // 🔥 Nuevo: Puntos por referido
  @Prop({ default: 0 })
  points: number;

  // 🔥 Nuevo: Número de referidos
  @Prop({ default: 0 })
  referralsCount: number;

  // 🔥 Lista de referidos
  @Prop({ type: [String], default: [] })
  referrals: string[];

  //customer string
  @Prop({ default: 'customer' })
  usertype: string;

  // 🔥 2FA Configuración
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ select: false }) // Importante: que no venga en consultas normales por seguridad
  twoFactorSecret?: string;

  // 🔥 Términos y condiciones
  @Prop({ required: true, default: false })
  acceptTerms: boolean;

  // 🔥 Recuperación de contraseña
  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  // 🔥 Avatar del usuario (Base64 o URL)
  @Prop({ default: null })
  avatar: string;

  // refereridos
  @Prop({ default: null })
  sponsor_id: string;

  @Prop({ default: null })
  membership_expiration: Date;

  @Prop({ default: 0 })
  direct_referrals_count: number;

  @Prop({ default: null })
  wallet_address: string;

  @Prop({ enum: ['active', 'expired'], default: 'expired' })
  status: string;

  // 🔥 Session Control
  @Prop({ default: null })
  loginSessionId: string;

  // 🔥 Verificación de Email
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  emailVerificationCode: string;

  @Prop({ default: null })
  emailVerificationExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
