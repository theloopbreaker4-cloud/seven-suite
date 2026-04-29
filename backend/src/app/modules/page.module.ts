import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PagesController } from '../controllers/pages.controller';
import { PageService } from '../services/page.service';
import { PageSchema } from '../schemas/page.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Page', schema: PageSchema }])],
  controllers: [PagesController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
