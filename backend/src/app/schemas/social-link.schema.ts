import { Schema, model } from 'mongoose';

export interface SocialLink {
  platform:  string;
  url:       string;
  label:     string;
  sortOrder: number;
  isActive:  boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const SocialLinkSchema = new Schema<SocialLink>(
  {
    platform:  { type: String, required: true },
    url:       { type: String, required: true, trim: true },
    label:     { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SocialLinkModel = model<SocialLink>('SocialLink', SocialLinkSchema);
