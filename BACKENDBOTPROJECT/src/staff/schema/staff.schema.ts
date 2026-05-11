import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StaffDocument = Staff & Document;

export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  READER = 'reader',
}

@Schema({ timestamps: true })
export class Staff {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: StaffRole, default: StaffRole.READER })
  role: StaffRole;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  lastLogin: Date;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  createdBy?: string;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
