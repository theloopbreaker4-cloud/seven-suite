import { Schema, model } from 'mongoose';
import type { I18nContent } from './page.schema';

export interface Post {
  slug:        string;
  title:       I18nContent;
  excerpt:     I18nContent;
  content:     I18nContent;
  coverImage:  string;
  isPublished: boolean;
  createdAt?:  Date;
  updatedAt?:  Date;
}

export const PostSchema = new Schema<Post>(
  {
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    title:       { type: Schema.Types.Mixed, default: {} },
    excerpt:     { type: Schema.Types.Mixed, default: {} },
    content:     { type: Schema.Types.Mixed, default: {} },
    coverImage:  { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PostModel = model<Post>('Post', PostSchema);
