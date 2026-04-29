import { Schema, model } from 'mongoose';

// i18n content: { en: '...', ru: '...', ka: '...', uk: '...', az: '...', hy: '...' }
export interface I18nContent {
  en?: string;
  ru?: string;
  ka?: string;
  uk?: string;
  az?: string;
  hy?: string;
}

export interface Page {
  slug:        string;
  title:       I18nContent;
  content:     I18nContent;
  metaDesc:    I18nContent;
  isPublished: boolean;
  createdAt?:  Date;
  updatedAt?:  Date;
}

export const PageSchema = new Schema<Page>(
  {
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    title:       { type: Schema.Types.Mixed, default: {} },
    content:     { type: Schema.Types.Mixed, default: {} },
    metaDesc:    { type: Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PageModel = model<Page>('Page', PageSchema);
