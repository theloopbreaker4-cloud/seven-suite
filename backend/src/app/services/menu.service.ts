import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu } from '../schemas/menu.schema';

@Injectable()
export class MenuService {
  constructor(@InjectModel('Menu') private readonly model: Model<Menu>) {}

  findAll(): Promise<Menu[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  findByHandle(handle: string): Promise<Menu | null> {
    return this.model.findOne({ handle }).exec();
  }

  create(data: Partial<Menu>): Promise<Menu> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<Menu>): Promise<Menu | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<Menu | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
