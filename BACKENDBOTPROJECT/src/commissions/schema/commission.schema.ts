import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Commission extends Document {
  @Prop({ required: true })
  transaction_id: string;

  @Prop({ type: String, ref: 'User', required: true })
  receiver_id: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['approved', 'rejected', 'skipped'], default: 'approved' })
  validation_status: string;

  @Prop()
  reason_if_rejected: string;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
