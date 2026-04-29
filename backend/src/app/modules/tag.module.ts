import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagsController } from '../controllers/tags.controller';
import { TagService } from '../services/tag.service';
import { TagSchema } from '../schemas/tag.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }])],
  controllers: [TagsController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
