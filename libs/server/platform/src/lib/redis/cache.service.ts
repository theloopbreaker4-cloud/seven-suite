/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Small JSON cache on the shared Redis. Keys are namespaced (`cache:<scope>:<key>`) — pass the
 * organization id as the scope for anything tenant-specific so one tenant can never read
 * another's entry. A Redis outage degrades to "no cache", never to an error.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  /** Concurrent misses for the same key share one computation (no stampede inside a process). */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(private readonly redis: RedisService) {}

  private key(scope: string, key: string): string {
    return `cache:${scope}:${key}`;
  }

  async get<T>(scope: string, key: string): Promise<T | undefined> {
    try {
      await this.ready();
      const raw = await this.redis.client.get(this.key(scope, key));
      return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch (err) {
      this.logger.warn(`cache get failed: ${(err as Error).message}`);
      return undefined;
    }
  }

  async set(scope: string, key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (value === undefined) return;
    try {
      await this.ready();
      await this.redis.client.set(this.key(scope, key), JSON.stringify(value), 'EX', Math.max(1, Math.round(ttlSeconds)));
    } catch (err) {
      this.logger.warn(`cache set failed: ${(err as Error).message}`);
    }
  }

  /** Cached value, or compute it with `load`, store for `ttlSeconds` and return it. */
  async wrap<T>(scope: string, key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(scope, key);
    if (hit !== undefined) return hit;
    const full = this.key(scope, key);
    const running = this.inflight.get(full) as Promise<T> | undefined;
    if (running) return running;
    const p = load()
      .then(async (value) => {
        await this.set(scope, key, value, ttlSeconds);
        return value;
      })
      .finally(() => this.inflight.delete(full));
    this.inflight.set(full, p);
    return p;
  }

  async del(scope: string, key: string): Promise<void> {
    try {
      await this.ready();
      await this.redis.client.del(this.key(scope, key));
    } catch (err) {
      this.logger.warn(`cache del failed: ${(err as Error).message}`);
    }
  }

  /** Drop every entry of a scope (e.g. all of one organization's cache after a settings change). */
  async clearScope(scope: string): Promise<number> {
    let removed = 0;
    try {
      await this.ready();
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.client.scan(cursor, 'MATCH', `cache:${scope}:*`, 'COUNT', 200);
        cursor = next;
        if (keys.length) removed += await this.redis.client.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`cache clear failed: ${(err as Error).message}`);
    }
    return removed;
  }

  private async ready(): Promise<void> {
    if (this.redis.client.status === 'wait') await this.redis.client.connect();
  }
}
