/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: media.module.ts
 * Description: Media module — registers schema, service and controller for file uploads
 * Created: 2026-04-24
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaSchema } from '../schemas/media.schema';
import { MediaService } from '../services/media.service';
import { MediaController } from '../controllers/media.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Media', schema: MediaSchema }])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
