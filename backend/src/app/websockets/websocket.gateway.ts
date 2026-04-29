/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: websocket.gateway.ts
 * Description: WebSocket gateway for handling real-time bidirectional communication using Socket.IO
 * Created: 2025-10-26
 */

import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
// Services
import { ChatService } from './services/chat.service';
import { NotificationService, NotificationType } from './services/notification.service';

/**
 * Gateway for managing WebSocket connections and message broadcasting
 * @remarks Handles chat, notifications, and real-time updates with room support
 */
@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Configure proper CORS origins in production
    credentials: true,
  },
  namespace: '/', // Default namespace, can be changed to '/chat', '/notifications', etc.
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebsocketGateway');
  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Called when a client connects to the WebSocket server
   * @param client - Connected socket client
   */
  async handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients.size})`);

    // Send welcome message to the connected client
    client.emit('connection:success', {
      clientId: client.id,
      message: 'Successfully connected to WebSocket server',
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all clients about new connection (optional)
    this.server.emit('user:connected', {
      clientId: client.id,
      totalClients: this.connectedClients.size,
    });
  }

  /**
   * Called when a client disconnects from the WebSocket server
   * @param client - Disconnected socket client
   */
  async handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);

    // Broadcast to all clients about disconnection
    this.server.emit('user:disconnected', {
      clientId: client.id,
      totalClients: this.connectedClients.size,
    });
  }

  /* ========================================
   * CHAT EVENTS
   * ======================================== */

  /**
   * Handles chat messages - broadcasts to all connected clients
   * @param client - Socket client sending the message
   * @param payload - Chat message payload
   */
  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; username?: string; roomId?: string },
  ) {
    this.logger.log(`Chat message from ${client.id}: ${payload.message}`);

    const processedMessage = await this.chatService.handleMessage({
      clientId: client.id,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all clients or specific room
    if (payload.roomId) {
      this.server.to(payload.roomId).emit('chat:message', processedMessage);
    } else {
      this.server.emit('chat:message', processedMessage);
    }

    return processedMessage;
  }

  /**
   * Handles private messages between users
   * @param client - Sender socket client
   * @param payload - Private message payload with target client ID
   */
  @SubscribeMessage('chat:private')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetClientId: string; message: string },
  ) {
    const targetSocket = this.connectedClients.get(payload.targetClientId);

    if (targetSocket) {
      targetSocket.emit('chat:private', {
        from: client.id,
        message: payload.message,
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'Private message sent' };
    } else {
      return { success: false, message: 'Target client not found' };
    }
  }

  /**
   * User is typing indicator
   * @param client - Socket client that is typing
   * @param payload - Typing indicator payload
   */
  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { isTyping: boolean; roomId?: string },
  ) {
    const event = payload.roomId
      ? this.server.to(payload.roomId)
      : this.server;

    event.emit('chat:typing', {
      clientId: client.id,
      isTyping: payload.isTyping,
    });
  }

  /* ========================================
   * ROOM MANAGEMENT
   * ======================================== */

  /**
   * Join a specific room/channel
   * @param client - Socket client joining the room
   * @param payload - Room join payload
   */
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username?: string },
  ) {
    await client.join(payload.roomId);
    this.logger.log(`Client ${client.id} joined room: ${payload.roomId}`);

    // Notify room members
    this.server.to(payload.roomId).emit('room:user-joined', {
      clientId: client.id,
      username: payload.username,
      roomId: payload.roomId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Joined room ${payload.roomId}`,
      roomId: payload.roomId,
    };
  }

  /**
   * Leave a specific room/channel
   * @param client - Socket client leaving the room
   * @param payload - Room leave payload
   */
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    await client.leave(payload.roomId);
    this.logger.log(`Client ${client.id} left room: ${payload.roomId}`);

    // Notify room members
    this.server.to(payload.roomId).emit('room:user-left', {
      clientId: client.id,
      roomId: payload.roomId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: `Left room ${payload.roomId}` };
  }

  /* ========================================
   * NOTIFICATIONS
   * ======================================== */

  /**
   * Send notification to specific user
   * @param client - Socket client sending notification
   * @param payload - Notification payload
   */
  @SubscribeMessage('notification:send')
  async handleSendNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      targetClientId: string;
      title: string;
      message: string;
      type?: NotificationType;
    },
  ) {
    const notification = await this.notificationService.createNotification({
      from: client.id,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    const targetSocket = this.connectedClients.get(payload.targetClientId);
    if (targetSocket) {
      targetSocket.emit('notification:received', notification);
      return { success: true, notification };
    } else {
      return { success: false, message: 'Target user not connected' };
    }
  }

  /* ========================================
   * REAL-TIME UPDATES
   * ======================================== */

  /**
   * Subscribe to real-time data updates
   * @param client - Socket client subscribing
   * @param payload - Subscription payload
   */
  @SubscribeMessage('data:subscribe')
  handleDataSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { dataType: string; filters?: any },
  ) {
    const subscriptionRoom = `data:${payload.dataType}`;
    client.join(subscriptionRoom);

    this.logger.log(`Client ${client.id} subscribed to ${subscriptionRoom}`);

    return {
      success: true,
      message: `Subscribed to ${payload.dataType} updates`,
      subscriptionRoom,
    };
  }

  /**
   * Unsubscribe from real-time data updates
   * @param client - Socket client unsubscribing
   * @param payload - Unsubscription payload
   */
  @SubscribeMessage('data:unsubscribe')
  handleDataUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { dataType: string },
  ) {
    const subscriptionRoom = `data:${payload.dataType}`;
    client.leave(subscriptionRoom);

    return {
      success: true,
      message: `Unsubscribed from ${payload.dataType} updates`,
    };
  }

  /* ========================================
   * UTILITY METHODS (PUBLIC API for services)
   * ======================================== */

  /**
   * Broadcast message to all connected clients
   * @param event - Event name
   * @param data - Data to broadcast
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasting ${event} to all clients`);
  }

  /**
   * Broadcast message to specific room
   * @param roomId - Room identifier
   * @param event - Event name
   * @param data - Data to broadcast
   */
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
    this.logger.log(`Broadcasting ${event} to room ${roomId}`);
  }

  /**
   * Send message to specific client
   * @param clientId - Target client ID
   * @param event - Event name
   * @param data - Data to send
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Get count of connected clients
   * @returns Number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get all connected client IDs
   * @returns Array of client IDs
   */
  getConnectedClientIds(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
