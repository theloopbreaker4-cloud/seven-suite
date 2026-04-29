import { Schema, model } from 'mongoose';

export interface MenuItem {
  label:     string;
  url:       string;
  target:    '_self' | '_blank';
  sortOrder: number;
  parentId?: string;
}

export interface Menu {
  handle:    string;
  name:      string;
  items:     MenuItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuItemSchema = new Schema<MenuItem>(
  {
    label:     { type: String, required: true },
    url:       { type: String, required: true },
    target:    { type: String, enum: ['_self', '_blank'], default: '_self' },
    sortOrder: { type: Number, default: 0 },
    parentId:  { type: String, default: null },
  },
  { _id: false },
);

export const MenuSchema = new Schema<Menu>(
  {
    handle: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name:   { type: String, required: true, trim: true },
    items:  { type: [MenuItemSchema], default: [] },
  },
  { timestamps: true },
);

export const MenuModel = model<Menu>('Menu', MenuSchema);
