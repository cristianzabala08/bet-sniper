import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum HoldStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum HoldType {
  WITHDRAW = 'WITHDRAW',
}

@Schema({ timestamps: true })
export class Hold extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transaction_id: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: HoldType, default: HoldType.WITHDRAW })
  type: HoldType;

  @Prop({ required: true, enum: HoldStatus, default: HoldStatus.PENDING })
  status: HoldStatus;

  @Prop({ required: true })
  wallet: string;

  @Prop({ required: false })
  reason?: string; // Reason for rejection
}

export const HoldSchema = SchemaFactory.createForClass(Hold);
