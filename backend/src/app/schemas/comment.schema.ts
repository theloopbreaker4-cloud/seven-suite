import { Schema, model } from 'mongoose';

export interface Comment {
  postId:      string;
  userId?:     string;
  authorName:  string;
  authorEmail: string;
  body:        string;
  isApproved:  boolean;
  createdAt?:  Date;
  updatedAt?:  Date;
}

export const CommentSchema = new Schema<Comment>(
  {
    postId:      { type: String, required: true },
    userId:      { type: String, default: null },
    authorName:  { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    body:        { type: String, required: true, trim: true },
    isApproved:  { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CommentModel = model<Comment>('Comment', CommentSchema);
