import { Schema, model } from 'mongoose';
import type { I18nContent } from './page.schema';

export interface Tag {
  slug:       string;
  name:       I18nContent;
  createdAt?: Date;
  updatedAt?: Date;
}

export const TagSchema = new Schema<Tag>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const TagModel = model<Tag>('Tag', TagSchema);
