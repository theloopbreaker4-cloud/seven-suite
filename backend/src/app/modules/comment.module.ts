import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsController } from '../controllers/comments.controller';
import { CommentService } from '../services/comment.service';
import { CommentSchema } from '../schemas/comment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Comment', schema: CommentSchema }])],
  controllers: [CommentsController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
