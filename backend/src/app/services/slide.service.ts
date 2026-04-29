import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slide } from '../schemas/slide.schema';

@Injectable()
export class SlideService {
  constructor(@InjectModel('Slide') private readonly model: Model<Slide>) {}

  findAll(activeOnly = false): Promise<Slide[]> {
    const query = activeOnly ? { isActive: true } : {};
    return this.model.find(query).sort({ sortOrder: 1, createdAt: 1 }).exec();
  }

  findById(id: string): Promise<Slide | null> {
    return this.model.findById(id).exec();
  }

  create(data: Partial<Slide>): Promise<Slide> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<Slide>): Promise<Slide | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async reorder(order: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await Promise.all(
      order.map(({ id, sortOrder }) =>
        this.model.findByIdAndUpdate(id, { sortOrder })
      )
    );
  }

  remove(id: string): Promise<Slide | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
