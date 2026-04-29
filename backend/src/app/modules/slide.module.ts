import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SliderController } from '../controllers/slider.controller';
import { SlideService } from '../services/slide.service';
import { SlideSchema } from '../schemas/slide.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Slide', schema: SlideSchema }])],
  controllers: [SliderController],
  providers: [SlideService],
  exports: [SlideService],
})
export class SlideModule {}
