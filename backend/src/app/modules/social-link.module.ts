import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialLinksController } from '../controllers/social-links.controller';
import { SocialLinkService } from '../services/social-link.service';
import { SocialLinkSchema } from '../schemas/social-link.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'SocialLink', schema: SocialLinkSchema }])],
  controllers: [SocialLinksController],
  providers: [SocialLinkService],
  exports: [SocialLinkService],
})
export class SocialLinkModule {}
