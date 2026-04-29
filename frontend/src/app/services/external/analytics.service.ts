import { Injectable } from '@angular/core';

/**
 * Analytics Service
 *
 * Service for tracking user events and analytics
 * Integrates with analytics platforms (Google Analytics, Mixpanel, etc.)
 *
 * Usage:
 * constructor(private analytics: AnalyticsService) {}
 *
 * this.analytics.trackEvent('button_click', { button: 'login' });
 * this.analytics.trackPageView('/dashboard');
 * this.analytics.setUser('user123', { name: 'John Doe' });
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    console.log('[Analytics] Event:', eventName, properties);

    // TODO: Integrate with your analytics platform
    // Example for Google Analytics:
    // if (window.gtag) {
    //   window.gtag('event', eventName, properties);
    // }

    // Example for Mixpanel:
    // if (window.mixpanel) {
    //   window.mixpanel.track(eventName, properties);
    // }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string): void {
    console.log('[Analytics] Page View:', path, title);

    // TODO: Integrate with your analytics platform
    // Example for Google Analytics:
    // if (window.gtag) {
    //   window.gtag('config', 'GA_MEASUREMENT_ID', {
    //     page_path: path,
    //     page_title: title
    //   });
    // }
  }

  /**
   * Set user properties
   */
  setUser(userId: string, properties?: Record<string, any>): void {
    console.log('[Analytics] Set User:', userId, properties);

    // TODO: Integrate with your analytics platform
    // Example for Google Analytics:
    // if (window.gtag) {
    //   window.gtag('set', { user_id: userId, ...properties });
    // }

    // Example for Mixpanel:
    // if (window.mixpanel) {
    //   window.mixpanel.identify(userId);
    //   window.mixpanel.people.set(properties);
    // }
  }

  /**
   * Track timing/performance metrics
   */
  trackTiming(category: string, variable: string, value: number): void {
    console.log('[Analytics] Timing:', category, variable, value);

    // TODO: Integrate with your analytics platform
    // Example for Google Analytics:
    // if (window.gtag) {
    //   window.gtag('event', 'timing_complete', {
    //     name: variable,
    //     value: value,
    //     event_category: category
    //   });
    // }
  }

  /**
   * Track errors/exceptions
   */
  trackError(description: string, fatal: boolean = false): void {
    console.error('[Analytics] Error:', description, { fatal });

    // TODO: Integrate with your analytics platform
    // Example for Google Analytics:
    // if (window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: description,
    //     fatal: fatal
    //   });
    // }
  }
}
