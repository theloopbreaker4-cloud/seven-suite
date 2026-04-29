import { Schema, model } from 'mongoose';

export interface Media {
  filename:     string;
  originalName: string;
  path:         string;
  url:          string;
  mimeType:     string;
  size:         number;
  uploadedBy?:  string;
  createdAt?:   Date;
  updatedAt?:   Date;
}

export const MediaSchema = new Schema<Media>(
  {
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    path:         { type: String, required: true },
    url:          { type: String, required: true },
    mimeType:     { type: String, required: true },
    size:         { type: Number, required: true },
    uploadedBy:   { type: String, default: null },
  },
  { timestamps: true },
);

export const MediaModel = model<Media>('Media', MediaSchema);
