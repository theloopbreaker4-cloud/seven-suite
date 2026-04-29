import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Notification Types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification Interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number; // milliseconds
  dismissible?: boolean;
}

/**
 * Notification Service
 *
 * Service for displaying toast notifications/alerts
 *
 * Usage:
 * constructor(private notification: NotificationService) {}
 *
 * this.notification.success('Login successful!');
 * this.notification.error('Failed to save data');
 * this.notification.warning('Session will expire soon');
 * this.notification.info('New updates available');
 *
 * // Subscribe to notifications in a component
 * this.notification.notifications$.subscribe(notifications => {
 *   // Display notifications
 * });
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new Subject<Notification>();
  private notificationsList: Notification[] = [];

  /**
   * Observable stream of notifications
   */
  notifications$: Observable<Notification> = this.notificationsSubject.asObservable();

  /**
   * Show a success notification
   */
  success(message: string, title?: string, duration: number = 3000): void {
    this.show('success', message, title, duration);
  }

  /**
   * Show an error notification
   */
  error(message: string, title?: string, duration: number = 5000): void {
    this.show('error', message, title, duration);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, title?: string, duration: number = 4000): void {
    this.show('warning', message, title, duration);
  }

  /**
   * Show an info notification
   */
  info(message: string, title?: string, duration: number = 3000): void {
    this.show('info', message, title, duration);
  }

  /**
   * Show a custom notification
   */
  show(
    type: NotificationType,
    message: string,
    title?: string,
    duration: number = 3000,
    dismissible: boolean = true
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      title,
      duration,
      dismissible,
    };

    this.notificationsList.push(notification);
    this.notificationsSubject.next(notification);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): void {
    const index = this.notificationsList.findIndex(n => n.id === id);
    if (index > -1) {
      this.notificationsList.splice(index, 1);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsList = [];
  }

  /**
   * Get all active notifications
   */
  getAll(): Notification[] {
    return [...this.notificationsList];
  }

  /**
   * Generate a unique ID for notifications
   */
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
