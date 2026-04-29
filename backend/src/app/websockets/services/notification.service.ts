/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: notification.service.ts
 * Description: Service for managing real-time notifications across WebSocket connections
 * Created: 2025-10-26
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Notification type enumeration
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Interface for notification structure
 */
export interface Notification {
  id: string;
  from: string;
  targetClientId: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read?: boolean;
  readAt?: string;
}

/**
 * NotificationService - manages real-time notifications
 * @remarks Handles notification creation, storage, and delivery tracking
 */
@Injectable()
export class NotificationService {
  private logger: Logger = new Logger('NotificationService');
  private notifications: Map<string, Notification[]> = new Map(); // clientId -> notifications[]
  private readonly MAX_NOTIFICATIONS_PER_USER = 50;

  /**
   * Create a new notification
   * @param data - Notification data
   * @returns Created notification object
   */
  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      from: data.from || 'system',
      targetClientId: data.targetClientId,
      title: data.title || 'Notification',
      message: data.message || '',
      type: (data.type as NotificationType) || NotificationType.INFO,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
    };

    // Store notification
    this.storeNotification(notification);

    this.logger.log(`Created notification ${notification.id} for ${notification.targetClientId}`);

    return notification;
  }

  /**
   * Get all notifications for a specific client
   * @param clientId - Target client ID
   * @param onlyUnread - If true, returns only unread notifications
   * @returns Array of notifications
   */
  getNotifications(clientId: string, onlyUnread: boolean = false): Notification[] {
    const userNotifications = this.notifications.get(clientId) || [];

    if (onlyUnread) {
      return userNotifications.filter((n) => !n.read);
    }

    return userNotifications;
  }

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @param clientId - Client ID
   * @returns Updated notification or null if not found
   */
  markAsRead(notificationId: string, clientId: string): Notification | null {
    const userNotifications = this.notifications.get(clientId);

    if (!userNotifications) {
      return null;
    }

    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this.logger.log(`Marked notification ${notificationId} as read`);
      return notification;
    }

    return null;
  }

  /**
   * Mark all notifications as read for a client
   * @param clientId - Target client ID
   * @returns Number of notifications marked as read
   */
  markAllAsRead(clientId: string): number {
    const userNotifications = this.notifications.get(clientId);

    if (!userNotifications) {
      return 0;
    }

    const timestamp = new Date().toISOString();
    let count = 0;

    userNotifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = timestamp;
        count++;
      }
    });

    this.logger.log(`Marked ${count} notifications as read for ${clientId}`);
    return count;
  }

  /**
   * Delete a specific notification
   * @param notificationId - Notification ID to delete
   * @param clientId - Client ID
   * @returns true if deleted, false if not found
   */
  deleteNotification(notificationId: string, clientId: string): boolean {
    const userNotifications = this.notifications.get(clientId);

    if (!userNotifications) {
      return false;
    }

    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index !== -1) {
      userNotifications.splice(index, 1);
      this.logger.log(`Deleted notification ${notificationId}`);
      return true;
    }

    return false;
  }

  /**
   * Clear all notifications for a client
   * @param clientId - Target client ID
   */
  clearAllNotifications(clientId: string): void {
    this.notifications.delete(clientId);
    this.logger.log(`Cleared all notifications for ${clientId}`);
  }

  /**
   * Get unread notification count
   * @param clientId - Target client ID
   * @returns Number of unread notifications
   */
  getUnreadCount(clientId: string): number {
    const userNotifications = this.notifications.get(clientId) || [];
    return userNotifications.filter((n) => !n.read).length;
  }

  /**
   * Broadcast notification to multiple clients
   * @param clientIds - Array of target client IDs
   * @param title - Notification title
   * @param message - Notification message
   * @param type - Notification type
   * @returns Array of created notifications
   */
  async broadcastNotification(
    clientIds: string[],
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const clientId of clientIds) {
      const notification = await this.createNotification({
        targetClientId: clientId,
        title,
        message,
        type,
      });
      notifications.push(notification);
    }

    this.logger.log(`Broadcasted notification to ${clientIds.length} clients`);
    return notifications;
  }

  /* ========================================
   * PRIVATE HELPER METHODS
   * ======================================== */

  /**
   * Store notification in memory
   * @param notification - Notification to store
   */
  private storeNotification(notification: Notification): void {
    const clientId = notification.targetClientId;
    let userNotifications = this.notifications.get(clientId);

    if (!userNotifications) {
      userNotifications = [];
      this.notifications.set(clientId, userNotifications);
    }

    userNotifications.push(notification);

    // Maintain size limit
    if (userNotifications.length > this.MAX_NOTIFICATIONS_PER_USER) {
      userNotifications.shift();
    }
  }

  /**
   * Generate unique notification ID
   * @returns Unique notification identifier
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
