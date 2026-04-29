/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: chat.service.ts
 * Description: Service handling chat message processing and business logic for WebSocket communications
 * Created: 2025-10-26
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface for chat message structure
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
 * Service for managing chat message operations
 * @remarks Handles message validation, sanitization, and storage
 */
@Injectable()
export class ChatService {
  private logger: Logger = new Logger('ChatService');
  private messageHistory: ChatMessage[] = []; // In-memory storage (TODO: replace with database)
  private readonly MAX_MESSAGE_LENGTH = 1000;
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Processes incoming chat messages
   * @param payload - Message payload containing chat data
   * @returns Processed chat message
   */
  async handleMessage(payload: Partial<ChatMessage>): Promise<ChatMessage> {
    this.logger.log(`Processing message from ${payload.clientId}`);

    // Sanitize and validate message
    const sanitizedMessage = this.sanitizeMessage(payload.message || '');

    if (!this.validateMessage(sanitizedMessage)) {
      throw new Error('Invalid message content');
    }

    // Create processed message object
    const processedMessage: ChatMessage = {
      id: this.generateMessageId(),
      clientId: payload.clientId,
      username: payload.username || `User_${payload.clientId.substring(0, 8)}`,
      message: sanitizedMessage,
      roomId: payload.roomId,
      timestamp: payload.timestamp || new Date().toISOString(),
      edited: false,
    };

    // Store in history
    this.addToHistory(processedMessage);

    return processedMessage;
  }

  /**
   * Get chat history for a specific room or global chat
   * @param roomId - Optional room ID to filter messages
   * @param limit - Maximum number of messages to return
   * @returns Array of chat messages
   */
  getHistory(roomId?: string, limit: number = 50): ChatMessage[] {
    let messages = roomId
      ? this.messageHistory.filter((msg) => msg.roomId === roomId)
      : this.messageHistory.filter((msg) => !msg.roomId);

    return messages.slice(-limit);
  }

  /**
   * Edit an existing message
   * @param messageId - ID of message to edit
   * @param newContent - New message content
   * @param clientId - Client ID requesting the edit
   * @returns Updated message or null if not found/unauthorized
   */
  async editMessage(
    messageId: string,
    newContent: string,
    clientId: string,
  ): Promise<ChatMessage | null> {
    const messageIndex = this.messageHistory.findIndex((msg) => msg.id === messageId);

    if (messageIndex === -1) {
      return null;
    }

    const message = this.messageHistory[messageIndex];

    // Check if client is authorized to edit
    if (message.clientId !== clientId) {
      throw new Error('Unauthorized to edit this message');
    }

    const sanitizedContent = this.sanitizeMessage(newContent);

    if (!this.validateMessage(sanitizedContent)) {
      throw new Error('Invalid message content');
    }

    // Update message
    message.message = sanitizedContent;
    message.edited = true;
    message.editedAt = new Date().toISOString();

    this.messageHistory[messageIndex] = message;

    return message;
  }

  /**
   * Delete a message
   * @param messageId - ID of message to delete
   * @param clientId - Client ID requesting deletion
   * @returns true if deleted, false if not found
   */
  async deleteMessage(messageId: string, clientId: string): Promise<boolean> {
    const messageIndex = this.messageHistory.findIndex((msg) => msg.id === messageId);

    if (messageIndex === -1) {
      return false;
    }

    const message = this.messageHistory[messageIndex];

    // Check authorization
    if (message.clientId !== clientId) {
      throw new Error('Unauthorized to delete this message');
    }

    this.messageHistory.splice(messageIndex, 1);
    return true;
  }

  /**
   * Clear chat history for a specific room
   * @param roomId - Room ID to clear (optional, clears global if not provided)
   */
  clearHistory(roomId?: string): void {
    if (roomId) {
      this.messageHistory = this.messageHistory.filter((msg) => msg.roomId !== roomId);
    } else {
      this.messageHistory = this.messageHistory.filter((msg) => msg.roomId);
    }

    this.logger.log(`Cleared history for ${roomId || 'global chat'}`);
  }

  /**
   * Search messages by keyword
   * @param keyword - Search keyword
   * @param roomId - Optional room ID to filter
   * @returns Array of matching messages
   */
  searchMessages(keyword: string, roomId?: string): ChatMessage[] {
    const lowerKeyword = keyword.toLowerCase();

    let messages = roomId
      ? this.messageHistory.filter((msg) => msg.roomId === roomId)
      : this.messageHistory;

    return messages.filter(
      (msg) =>
        msg.message.toLowerCase().includes(lowerKeyword) ||
        msg.username?.toLowerCase().includes(lowerKeyword),
    );
  }

  /* ========================================
   * PRIVATE HELPER METHODS
   * ======================================== */

  /**
   * Sanitize message content (remove dangerous HTML, scripts, etc.)
   * @param message - Raw message string
   * @returns Sanitized message
   */
  private sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .substring(0, this.MAX_MESSAGE_LENGTH); // Limit length
  }

  /**
   * Validate message content
   * @param message - Message to validate
   * @returns true if valid, false otherwise
   */
  private validateMessage(message: string): boolean {
    return message.length > 0 && message.length <= this.MAX_MESSAGE_LENGTH;
  }

  /**
   * Add message to history with size limit
   * @param message - Message to add
   */
  private addToHistory(message: ChatMessage): void {
    this.messageHistory.push(message);

    // Maintain history size limit
    if (this.messageHistory.length > this.MAX_HISTORY_SIZE) {
      this.messageHistory.shift();
    }
  }

  /**
   * Generate unique message ID
   * @returns Unique message identifier
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}