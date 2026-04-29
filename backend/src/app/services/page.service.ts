import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page } from '../schemas/page.schema';

@Injectable()
export class PageService {
  constructor(@InjectModel('Page') private readonly pageModel: Model<Page>) {}

  findAll(): Promise<Page[]> {
    return this.pageModel.find({ isPublished: true }).sort({ createdAt: -1 }).exec();
  }

  async findAllAdmin(limit = 100, offset = 0): Promise<{ items: Page[]; total: number; limit: number; offset: number }> {
    const [items, total] = await Promise.all([
      this.pageModel.find().sort({ createdAt: -1 }).limit(Math.min(limit, 200)).skip(offset).exec(),
      this.pageModel.countDocuments(),
    ]);
    return { items, total, limit, offset };
  }

  findBySlug(slug: string): Promise<Page | null> {
    return this.pageModel.findOne({ slug, isPublished: true }).exec();
  }

  create(data: Partial<Page>): Promise<Page> {
    return this.pageModel.create(data);
  }

  update(id: string, data: Partial<Page>): Promise<Page | null> {
    return this.pageModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<Page | null> {
    return this.pageModel.findByIdAndDelete(id).exec();
  }
}
