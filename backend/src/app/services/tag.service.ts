import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag } from '../schemas/tag.schema';

@Injectable()
export class TagService {
  constructor(@InjectModel('Tag') private readonly model: Model<Tag>) {}

  findAll(): Promise<Tag[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  create(data: Partial<Tag>): Promise<Tag> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<Tag>): Promise<Tag | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<Tag | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
