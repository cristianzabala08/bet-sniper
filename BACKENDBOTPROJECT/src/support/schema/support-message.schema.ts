import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SupportMessageDocument = HydratedDocument<SupportMessage>;

@Schema()
export class SupportMessage {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  fromUserId: Types.ObjectId;

  @Prop({ required: true })
  created: number;

  @Prop({ default: 0 })
  lastupdated: number;
}

export const SupportMessageSchema =
  SchemaFactory.createForClass(SupportMessage);
