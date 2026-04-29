/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: media.service.ts
 * Description: Media service — persists uploaded asset metadata and cleans files on delete
 * Created: 2026-04-24
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Media } from '../schemas/media.schema';

@Injectable()
export class MediaService {
  constructor(@InjectModel('Media') private readonly mediaModel: Model<Media>) {}

  async list(): Promise<Media[]> {
    return this.mediaModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(data: Partial<Media>): Promise<Media> {
    return this.mediaModel.create(data);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const doc = await this.mediaModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Media not found');

    try {
      const abs = path.resolve(process.cwd(), doc.path);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      // ignore filesystem errors — DB record removal still proceeds
    }

    await this.mediaModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
