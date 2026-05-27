import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SignalDocument = Signal & Document;

@Schema({ timestamps: true })
export class Signal {
  @Prop({ required: true, index: true })
  mesa: string;

  @Prop({ type: Object, required: true })
  data: any; // Raw data from webhook

  @Prop({ required: true, index: true })
  tipo: string; // 'SIGNAL' o 'RESULT'

  @Prop({ required: false, default: false })
  win: boolean;

  @Prop({ required: false })
  ronda: number; // Para identificar la ronda actual del bot

  @Prop({ required: false, default: false })
  isOpen: boolean;

  @Prop({ required: false })
  winStep: number;
}

export const SignalSchema = SchemaFactory.createForClass(Signal);
