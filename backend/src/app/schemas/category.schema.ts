import { Schema, model } from 'mongoose';
import type { I18nContent } from './page.schema';

export interface Category {
  slug:        string;
  name:        I18nContent;
  description: I18nContent;
  type:        'post' | 'page';
  createdAt?:  Date;
  updatedAt?:  Date;
}

export const CategorySchema = new Schema<Category>(
  {
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    name:        { type: Schema.Types.Mixed, default: {} },
    description: { type: Schema.Types.Mixed, default: {} },
    type:        { type: String, enum: ['post', 'page'], default: 'post' },
  },
  { timestamps: true },
);

export const CategoryModel = model<Category>('Category', CategorySchema);
