import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BlogPost extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: '' })
  coverImage: string;

  @Prop({ default: '' })
  author: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isPublished: boolean;

  @Prop()
  publishedAt: Date;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
