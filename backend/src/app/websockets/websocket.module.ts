/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: websocket.module.ts
 * Description: Module that configures WebSocket functionality and provides chat and notification services
 * Created: 2025-10-26
 */

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { ChatService } from './services/chat.service';
import { NotificationService } from './services/notification.service';

/**
 * Module for WebSocket gateway and related services
 * @remarks Exports WebsocketGateway for use in other modules (e.g., broadcasting from controllers)
 */
@Module({
  providers: [WebsocketGateway, ChatService, NotificationService],
  exports: [WebsocketGateway, ChatService, NotificationService],
})
export class WebsocketModule {}