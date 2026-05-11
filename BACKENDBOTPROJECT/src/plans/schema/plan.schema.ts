import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  durationDays: number;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'USDT' })
  currency: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isTrialPlan: boolean;

  @Prop({ default: 0 })
  maxSignalsPerDay: number;

  @Prop({ default: 0 })
  commissionLevels: number;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop()
  createdBy?: string;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
