import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SocialLink } from '../schemas/social-link.schema';

@Injectable()
export class SocialLinkService {
  constructor(@InjectModel('SocialLink') private readonly model: Model<SocialLink>) {}

  findAll(activeOnly = false): Promise<SocialLink[]> {
    const query = activeOnly ? { isActive: true } : {};
    return this.model.find(query).sort({ sortOrder: 1, createdAt: 1 }).exec();
  }

  create(data: Partial<SocialLink>): Promise<SocialLink> {
    return this.model.create(data);
  }

  update(id: string, data: Partial<SocialLink>): Promise<SocialLink | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  remove(id: string): Promise<SocialLink | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
