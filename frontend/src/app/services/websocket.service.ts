/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: websocket.service.ts
 * Description: Angular service for WebSocket communication with Socket.IO
 * Created: 2025-10-26
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id?: string;
  clientId: string;
  username?: string;
  message: string;
  roomId?: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  from: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read?: boolean;
}

/**
 * WebSocketService - manages real-time communication with backend
 * @remarks Provides chat, notifications, and real-time data updates
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  private clientId$ = new BehaviorSubject<string | null>(null);

  // Chat observables
  private chatMessages$ = new Subject<ChatMessage>();
  private privateMessages$ = new Subject<ChatMessage>();
  private typingUsers$ = new Subject<{ clientId: string; isTyping: boolean }>();

  // Room observables
  private roomJoined$ = new Subject<{ clientId: string; username?: string; roomId: string }>();
  private roomLeft$ = new Subject<{ clientId: string; roomId: string }>();

  // Notification observables
  private notifications$ = new Subject<Notification>();

  // Connection observables
  private userConnected$ = new Subject<{ clientId: string; totalClients: number }>();
  private userDisconnected$ = new Subject<{ clientId: string; totalClients: number }>();

  constructor() {
    // Initialize socket connection
    const serverUrl = environment.wsUrl || environment.apiBaseUrl;
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    this.setupSocketListeners();
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Setup all socket event listeners
   */
  private setupSocketListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      this.connected$.next(false);
      this.clientId$.next(null);
    });

    this.socket.on('connection:success', (data: any) => {
      console.log('🎉 Connection success:', data);
      this.clientId$.next(data.clientId);
    });

    // User connection events
    this.socket.on('user:connected', (data: any) => {
      this.userConnected$.next(data);
    });

    this.socket.on('user:disconnected', (data: any) => {
      this.userDisconnected$.next(data);
    });

    // Chat events
    this.socket.on('chat:message', (data: ChatMessage) => {
      this.chatMessages$.next(data);
    });

    this.socket.on('chat:private', (data: ChatMessage) => {
      this.privateMessages$.next(data);
    });

    this.socket.on('chat:typing', (data: { clientId: string; isTyping: boolean }) => {
      this.typingUsers$.next(data);
    });

    // Room events
    this.socket.on('room:user-joined', (data: any) => {
      this.roomJoined$.next(data);
    });

    this.socket.on('room:user-left', (data: any) => {
      this.roomLeft$.next(data);
    });

    // Notification events
    this.socket.on('notification:received', (data: Notification) => {
      this.notifications$.next(data);
    });

    // Error handling
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });
  }

  /* ========================================
   * CHAT METHODS
   * ======================================== */

  /**
   * Send chat message to all users or specific room
   * @param message - Message text
   * @param username - Sender username (optional)
   * @param roomId - Room ID (optional, for room-specific messages)
   */
  sendMessage(message: string, username?: string, roomId?: string): void {
    this.socket.emit('chat:message', { message, username, roomId });
  }

  /**
   * Send private message to specific user
   * @param targetClientId - Target user's client ID
   * @param message - Message text
   */
  sendPrivateMessage(targetClientId: string, message: string): void {
    this.socket.emit('chat:private', { targetClientId, message });
  }

  /**
   * Send typing indicator
   * @param isTyping - Whether user is typing
   * @param roomId - Room ID (optional)
   */
  sendTypingIndicator(isTyping: boolean, roomId?: string): void {
    this.socket.emit('chat:typing', { isTyping, roomId });
  }

  /**
   * Observable for receiving chat messages
   */
  onChatMessage(): Observable<ChatMessage> {
    return this.chatMessages$.asObservable();
  }

  /**
   * Observable for receiving private messages
   */
  onPrivateMessage(): Observable<ChatMessage> {
    return this.privateMessages$.asObservable();
  }

  /**
   * Observable for typing indicators
   */
  onTypingIndicator(): Observable<{ clientId: string; isTyping: boolean }> {
    return this.typingUsers$.asObservable();
  }

  /* ========================================
   * ROOM METHODS
   * ======================================== */

  /**
   * Join a chat room
   * @param roomId - Room identifier
   * @param username - Username (optional)
   * @returns Promise with join result
   */
  joinRoom(roomId: string, username?: string): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('room:join', { roomId, username }, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Leave a chat room
   * @param roomId - Room identifier
   * @returns Promise with leave result
   */
  leaveRoom(roomId: string): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('room:leave', { roomId }, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Observable for user joined room events
   */
  onUserJoinedRoom(): Observable<{ clientId: string; username?: string; roomId: string }> {
    return this.roomJoined$.asObservable();
  }

  /**
   * Observable for user left room events
   */
  onUserLeftRoom(): Observable<{ clientId: string; roomId: string }> {
    return this.roomLeft$.asObservable();
  }

  /* ========================================
   * NOTIFICATION METHODS
   * ======================================== */

  /**
   * Send notification to specific user
   * @param targetClientId - Target user's client ID
   * @param title - Notification title
   * @param message - Notification message
   * @param type - Notification type
   */
  sendNotification(
    targetClientId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ): void {
    this.socket.emit('notification:send', { targetClientId, title, message, type });
  }

  /**
   * Observable for receiving notifications
   */
  onNotification(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  /* ========================================
   * DATA SUBSCRIPTION METHODS
   * ======================================== */

  /**
   * Subscribe to real-time data updates
   * @param dataType - Type of data to subscribe to
   * @param filters - Optional filters
   * @returns Promise with subscription result
   */
  subscribeToData(dataType: string, filters?: any): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('data:subscribe', { dataType, filters }, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Unsubscribe from real-time data updates
   * @param dataType - Type of data to unsubscribe from
   * @returns Promise with unsubscription result
   */
  unsubscribeFromData(dataType: string): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('data:unsubscribe', { dataType }, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Listen to specific event
   * @param event - Event name
   * @returns Observable for the event
   */
  on(event: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(event, (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  /* ========================================
   * STATE OBSERVABLES
   * ======================================== */

  /**
   * Observable for connection state
   */
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Observable for client ID
   */
  getClientId(): Observable<string | null> {
    return this.clientId$.asObservable();
  }

  /**
   * Observable for user connection events
   */
  onUserConnected(): Observable<{ clientId: string; totalClients: number }> {
    return this.userConnected$.asObservable();
  }

  /**
   * Observable for user disconnection events
   */
  onUserDisconnected(): Observable<{ clientId: string; totalClients: number }> {
    return this.userDisconnected$.asObservable();
  }

  /**
   * Get current connection status (synchronous)
   */
  getConnectionStatus(): boolean {
    return this.socket.connected;
  }

  /**
   * Get current client ID (synchronous)
   */
  getCurrentClientId(): string | null {
    return this.clientId$.value;
  }
}
