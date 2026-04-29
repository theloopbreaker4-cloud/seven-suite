/**
 * Project: Seven
 * File: redis.service.ts
 * Description: Redis service for caching and session management
 * Created: 2025-11-06
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache by key
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key} from cache:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cached key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting key ${key} in cache:`, error);
    }
  }

  /**
   * Delete key from cache
   * @param key - Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from cache:`, error);
    }
  }

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
      this.logger.debug(`Deleted keys: ${keys.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error deleting multiple keys from cache:`, error);
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns True if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== null && value !== undefined;
    } catch (error) {
      this.logger.error(`Error checking key ${key} in cache:`, error);
      return false;
    }
  }

  /**
   * Get or set value in cache with a loader function
   * @param key - Cache key
   * @param loader - Function to load value if not in cache
   * @param ttl - Time to live in seconds (optional)
   * @returns Cached or loaded value
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // Load value
      this.logger.debug(`Cache miss for key: ${key}, loading...`);
      const value = await loader();

      // Set in cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set session data
   * @param sessionId - Session ID
   * @param data - Session data
   * @param ttl - Time to live in seconds (default: 1 hour)
   */
  async setSession<T>(
    sessionId: string,
    data: T,
    ttl: number = 3600,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, data, ttl);
  }

  /**
   * Get session data
   * @param sessionId - Session ID
   * @returns Session data or null
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.get<T>(key);
  }

  /**
   * Delete session data
   * @param sessionId - Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  /**
   * Cache user data
   * @param userId - User ID
   * @param data - User data
   * @param ttl - Time to live in seconds (default: 30 minutes)
   */
  async cacheUser<T>(userId: string, data: T, ttl: number = 1800): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, data, ttl);
  }

  /**
   * Get cached user data
   * @param userId - User ID
   * @returns User data or null
   */
  async getCachedUser<T>(userId: string): Promise<T | null> {
    const key = `user:${userId}`;
    return await this.get<T>(key);
  }

  /**
   * Invalidate cached user data
   * @param userId - User ID
   */
  async invalidateUser(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.del(key);
  }
}
