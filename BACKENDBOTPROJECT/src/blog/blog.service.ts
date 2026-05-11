import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogPost } from './schema/blog-post.schema';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogPost.name) private blogModel: Model<BlogPost>,
  ) {}

  async create(dto: CreateBlogPostDto): Promise<BlogPost> {
    const post = new this.blogModel(dto);
    if (dto.isPublished) {
      post.publishedAt = new Date();
    }
    return post.save();
  }

  async findAll(includeUnpublished = false): Promise<BlogPost[]> {
    const filter = includeUnpublished ? {} : { isPublished: true };
    return this.blogModel.find(filter).sort({ sortOrder: 1, publishedAt: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const post = await this.blogModel.findOne({ slug }).exec();
    if (!post) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }
    // Increment views
    post.views += 1;
    await post.save();
    return post;
  }

  async findOne(id: string): Promise<BlogPost> {
    const post = await this.blogModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Blog post with id "${id}" not found`);
    }
    return post;
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.blogModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Blog post with id "${id}" not found`);
    }
    if (dto.isPublished && !post.isPublished) {
      post.publishedAt = new Date();
    }
    Object.assign(post, dto);
    return post.save();
  }

  async remove(id: string): Promise<BlogPost> {
    const post = await this.blogModel.findByIdAndDelete(id).exec();
    if (!post) {
      throw new NotFoundException(`Blog post with id "${id}" not found`);
    }
    return post;
  }
}
