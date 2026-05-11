import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, index: true })
  action: string; // e.g. 'LOGIN', 'CREATE_USER'

  @Prop({ required: true, index: true })
  module: string; // e.g. 'AUTH', 'USERS'

  @Prop({ required: true, index: true })
  performedBy: string; // User ID or Staff ID

  @Prop()
  targetId?: string; // ID of the object being modified

  @Prop({ type: Object })
  details: any; // Flexible JSON for details

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
