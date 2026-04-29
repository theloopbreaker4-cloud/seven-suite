import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Storage Service
 *
 * Service for interacting with browser storage (localStorage, sessionStorage)
 * Provides type-safe methods with JSON serialization/deserialization
 *
 * Usage:
 * constructor(private storage: StorageService) {}
 *
 * this.storage.setItem('user', { id: 1, name: 'John' });
 * const user = this.storage.getItem<User>('user');
 * this.storage.removeItem('user');
 * this.storage.clear();
 */
// SSR-safe no-op storage used on the server
class NoopStorage implements Storage {
  private _data: Record<string, string> = {};
  get length() { return Object.keys(this._data).length; }
  key(index: number) { return Object.keys(this._data)[index] ?? null; }
  getItem(key: string) { return this._data[key] ?? null; }
  setItem(key: string, value: string) { this._data[key] = value; }
  removeItem(key: string) { delete this._data[key]; }
  clear() { this._data = {}; }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  protected readonly storage: Storage;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.storage = isPlatformBrowser(platformId) ? window.localStorage : new NoopStorage();
  }

  setItem<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item !== null ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  hasItem(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }

  getAllKeys(): string[] {
    return Object.keys(this.storage);
  }

  get length(): number {
    return this.storage.length;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService extends StorageService {
  constructor(@Inject(PLATFORM_ID) platformId: object) {
    super(platformId);
    (this as any).storage = isPlatformBrowser(platformId) ? window.sessionStorage : new NoopStorage();
  }
}
