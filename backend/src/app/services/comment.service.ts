import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schemas/comment.schema';

@Injectable()
export class CommentService {
  constructor(@InjectModel('Comment') private readonly model: Model<Comment>) {}

  findAll(postId?: string, approved?: boolean): Promise<Comment[]> {
    const query: Record<string, unknown> = {};
    if (postId)            query['postId'] = postId;
    if (approved != null)  query['isApproved'] = approved;
    return this.model.find(query).sort({ createdAt: -1 }).limit(200).exec();
  }

  findApproved(postId: string): Promise<Comment[]> {
    return this.model.find({ postId, isApproved: true }).sort({ createdAt: -1 }).exec();
  }

  create(data: Partial<Comment>): Promise<Comment> {
    return this.model.create({ ...data, isApproved: false });
  }

  approve(id: string): Promise<Comment | null> {
    return this.model.findByIdAndUpdate(id, { isApproved: true }, { new: true }).exec();
  }

  remove(id: string): Promise<Comment | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
