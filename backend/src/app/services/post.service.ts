import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from '../schemas/post.schema';

@Injectable()
export class PostService {
  constructor(@InjectModel('Post') private readonly postModel: Model<Post>) {}

  findAll(limit = 20, offset = 0): Promise<Post[]> {
    return this.postModel
      .find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .skip(offset)
      .exec();
  }

  async findAllAdmin(limit = 20, offset = 0): Promise<{ items: Post[]; total: number; limit: number; offset: number }> {
    const [items, total] = await Promise.all([
      this.postModel.find().sort({ createdAt: -1 }).limit(Math.min(limit, 100)).skip(offset).exec(),
      this.postModel.countDocuments(),
    ]);
    return { items, total, limit, offset };
  }

  findBySlug(slug: string): Promise<Post | null> {
    return this.postModel.findOne({ slug, isPublished: true }).exec();
  }

  create(data: Partial<Post>): Promise<Post> {
    return this.postModel.create(data);
  }

  update(id: string, data: Partial<Post>): Promise<Post | null> {
    return this.postModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<Post | null> {
    return this.postModel.findByIdAndDelete(id).exec();
  }
}
