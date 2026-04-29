import { Schema, model } from 'mongoose';
import type { I18nContent } from './page.schema';

export interface Slide {
  title:      I18nContent;
  subtitle:   I18nContent;
  buttonText: I18nContent;
  buttonUrl:  string;
  image:      string;
  overlay:    'none' | 'dark' | 'light';
  sortOrder:  number;
  isActive:   boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const SlideSchema = new Schema<Slide>(
  {
    title:      { type: Schema.Types.Mixed, default: {} },
    subtitle:   { type: Schema.Types.Mixed, default: {} },
    buttonText: { type: Schema.Types.Mixed, default: {} },
    buttonUrl:  { type: String, default: '' },
    image:      { type: String, default: '' },
    overlay:    { type: String, enum: ['none', 'dark', 'light'], default: 'none' },
    sortOrder:  { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SlideModel = model<Slide>('Slide', SlideSchema);
