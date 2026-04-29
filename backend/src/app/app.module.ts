/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app.module.ts
 * Description: Root application module - configures all modules, controllers, providers and middleware
 * Created: 2025-10-26
 */

import { Module, OnModuleInit, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpAdapterHost } from '@nestjs/core';
import { AppConfigService } from '../app/config/config.service';
import { AppConfigModule } from '../app/config/config.modules';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websockets/websocket.module';
import { WebsocketGateway } from './websockets/websocket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ContextMiddleware } from './middlewares/context.middleware';
// API Modules
import { UserModule }       from './modules/user.module';
import { PageModule }       from './modules/page.module';
import { PostModule }       from './modules/post.module';
import { CategoryModule }   from './modules/category.module';
import { TagModule }        from './modules/tag.module';
import { CommentModule }    from './modules/comment.module';
import { MenuModule }       from './modules/menu.module';
import { SocialLinkModule } from './modules/social-link.module';
import { SlideModule }      from './modules/slide.module';
import { MediaModule }      from './modules/media.module';
import { AuthModule }       from './auth/auth.module';
import { RedisModule }      from './redis/redis.module';
import { LoggerModule }     from './modules/logger.module';

/**
 * AppModule - root application module
 * @remarks Configures MongoDB, WebSocket, context middleware and API routing with automatic redirect to API prefix
 */
@Module({
  imports: [
    // Config
    AppConfigModule,
    // Global logger
    LoggerModule,
    // Redis
    RedisModule,
    // Websocket
    WebsocketModule,
    // Database
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => ({
        uri: configService.getDatabaseHost(),
      }),
    }),
    // Auth Module
    AuthModule,
    // Models
    UserModule,
    PageModule,
    PostModule,
    CategoryModule,
    TagModule,
    CommentModule,
    MenuModule,
    SocialLinkModule,
    SlideModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})

export class AppModule implements OnModuleInit, NestModule {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) { }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware)
      .forRoutes('*');
  }

  onModuleInit() {

    const globalPrefix = this.appConfigService.getGlobalPrefix();
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    httpAdapter.use((req: Request, res: Response, next: Function) => {
      const fullUrl = `${req.protocol}://${req.get('host')}/${globalPrefix}/`;
      if (
        req.originalUrl === '/' ||
        req.originalUrl === this.appConfigService.getApiPath() ||
        req.originalUrl === this.appConfigService.getApiPath().toString().slice(0, -1)
      ) {
        res.redirect(fullUrl);
      } else {
        next();
      }
    });
  }
}

