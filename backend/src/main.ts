/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: main.ts
 * Description: Backend application entry point - configures NestJS server, Swagger, WebSocket and global middleware
 * Created: 2025-10-26
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app/config/config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppLoggerService } from './app/services/logger.service';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const fileLogger = new AppLoggerService();

/**
 * Bootstrap function - initializes and starts the NestJS application
 * @remarks Configures global prefix, body parser, WebSocket adapter, validation pipes and Swagger (dev only)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: fileLogger });

  const configService = new ConfigService();
  const appConfigService = new AppConfigService(configService);

  // Get URLs from environment
  const frontendUrl = process.env.FRONTEND_HOST;
  const backendUrl = process.env.BACKEND_HOST;

  // Enable CORS for frontend communication
  // Enable CORS for frontend communication
app.enableCors({
  origin: (requestOrigin, callback) => {
    const allowedOrigins = [frontendUrl, backendUrl];
    console.log('CORS frontendUrl:', frontendUrl);
console.log('CORS backendUrl:', backendUrl);

    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true); // разрешаем запрос
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});


  const globalPrefix = appConfigService.getGlobalPrefix();
  app.setGlobalPrefix(globalPrefix);

  app.use(bodyParser.json({ limit: '50mb' }));

  // Serve uploaded media assets from /uploads (outside the API prefix)
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  if (process.env.NODE_ENV == 'development') {
    const config = new DocumentBuilder()
    .setTitle('SevenApp - Application')
    .setDescription("API Application")
    .setVersion('v1')
    .addTag('Info')
    .build();
  
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(globalPrefix, app, document);
  }

  await app.listen(appConfigService.getPort());

  fileLogger.log(`SevenCMS Angular.io backend started on port ${appConfigService.getPort()}`, 'Bootstrap');
}

bootstrap();
