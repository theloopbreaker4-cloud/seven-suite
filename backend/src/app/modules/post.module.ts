import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from '../controllers/posts.controller';
import { PostService } from '../services/post.service';
import { PostSchema } from '../schemas/post.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Post', schema: PostSchema }])],
  controllers: [PostsController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
