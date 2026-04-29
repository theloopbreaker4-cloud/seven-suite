import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../schemas/category.schema';

@Injectable()
export class CategoryService {
  constructor(@InjectModel('Category') private readonly model: Model<Category>) {}

  findAll(type?: string): Promise<Category[]> {
    const query = type ? { type } : {};
    return this.model.find(query).sort({ createdAt: -1 }).exec();
  }

  findBySlug(slug: string): Promise<Category | null> {
    return this.model.findOne({ slug }).exec();
  }

  create(data: Partial<Category>): Promise<Category> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<Category>): Promise<Category | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<Category | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
