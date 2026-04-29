/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: theme.service.ts
 * Description: Service for managing light/dark theme switching
 * Created: 2025-11-02
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

/**
 * ThemeService - handles theme switching and persistence
 * @remarks Manages theme state and stores preference in localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /**
   * Current theme subject
   */
  private currentThemeSubject: BehaviorSubject<Theme>;

  /**
   * Current theme observable
   */
  public currentTheme: Observable<Theme>;

  /**
   * Flag to check if code is running in browser
   */
  private isBrowser: boolean;

  /**
   * Local storage key for theme preference
   */
  private readonly THEME_STORAGE_KEY = 'app-theme';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize theme from storage or system preference
    const initialTheme = this.getInitialTheme();
    this.currentThemeSubject = new BehaviorSubject<Theme>(initialTheme);
    this.currentTheme = this.currentThemeSubject.asObservable();

    // Apply initial theme
    this.applyTheme(initialTheme);
  }

  /**
   * Get current theme value
   */
  public get currentThemeValue(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Get initial theme from storage or system preference
   * @returns Theme ('light' or 'dark')
   */
  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }

    // Check localStorage first
    const storedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * Set theme and persist to storage
   * @param theme - Theme to set ('light' or 'dark')
   */
  public setTheme(theme: Theme): void {
    if (theme !== 'light' && theme !== 'dark') {
      console.error('Invalid theme:', theme);
      return;
    }

    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);

    // Persist to localStorage (only in browser)
    if (this.isBrowser) {
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    }
  }

  /**
   * Toggle between light and dark themes
   */
  public toggleTheme(): void {
    const newTheme = this.currentThemeValue === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Apply theme to document
   * @param theme - Theme to apply
   */
  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }

    const htmlElement = document.documentElement;

    // Remove existing theme class
    htmlElement.removeAttribute('data-theme');

    // Add new theme class with slight delay for smooth transition
    requestAnimationFrame(() => {
      htmlElement.setAttribute('data-theme', theme);
    });
  }

  /**
   * Check if current theme is dark
   * @returns true if current theme is dark
   */
  public isDarkTheme(): boolean {
    return this.currentThemeValue === 'dark';
  }

  /**
   * Check if current theme is light
   * @returns true if current theme is light
   */
  public isLightTheme(): boolean {
    return this.currentThemeValue === 'light';
  }

  /**
   * Listen to system theme changes
   * @remarks Automatically updates theme when system preference changes
   */
  public watchSystemTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
        const newTheme = e.matches ? 'dark' : 'light';
        this.setTheme(newTheme);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
  }

  /**
   * Clear theme preference from storage
   * @remarks Theme will revert to system preference
   */
  public clearThemePreference(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.THEME_STORAGE_KEY);

    // Reset to system preference
    const systemTheme = this.getInitialTheme();
    this.setTheme(systemTheme);
  }
}
