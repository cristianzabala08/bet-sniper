import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionDetail } from '../enums/transaction-detail.enum';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: String, required: true })
  user_id: string;

  // @Prop({ enum: ['first purchase', 'renewal', 'upgrade'], required: true })
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: false,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({ required: false, enum: TransactionDetail })
  details: TransactionDetail;

  @Prop({ required: false })
  txHash: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
