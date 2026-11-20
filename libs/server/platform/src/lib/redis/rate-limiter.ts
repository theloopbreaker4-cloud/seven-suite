/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable } from '@nestjs/common';
import { DomainError } from '../errors/domain-error';
import { RedisService } from './redis.service';

/** Fixed-window counters in Redis, shared by every API instance. */
@Injectable()
export class RateLimiter {
  constructor(private readonly redis: RedisService) {}

  /** Count one hit; throws 429 once `limit` hits happened within `windowSeconds`. */
  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const k = `rl:${key}`;
    const [[, count]] = (await this.redis.client
      .multi()
      .incr(k)
      .expire(k, windowSeconds, 'NX')
      .exec()) as [[Error | null, number], unknown];
    if (count > limit) throw DomainError.tooManyRequests();
  }
}
