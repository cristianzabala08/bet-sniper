import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GenesisUserDocument = GenesisUser & Document;

@Schema({ timestamps: true })
export class GenesisUser {
  @Prop({ required: true, unique: true })
  genesisUserId: string;

  @Prop({ required: true })
  genesisUsername: string;

  @Prop({ required: false })
  genesisEmail: string;

  @Prop({ required: false })
  wallet: string;

  @Prop({
    type: String,
    enum: ['NONE', 'WEEKLY', 'BASIC', 'AMATEUR', 'PRO', 'EXPERT', 'ELITE'],
    default: 'NONE',
  })
  plan: string;

  @Prop({ default: null })
  membership_expiration: Date;

  @Prop({ enum: ['active', 'expired'], default: 'expired' })
  status: string;

  @Prop({ default: null })
  lastTxHash: string;
}

export const GenesisUserSchema = SchemaFactory.createForClass(GenesisUser);
