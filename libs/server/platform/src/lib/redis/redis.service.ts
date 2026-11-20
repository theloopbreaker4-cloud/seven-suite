/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/** Shared Redis connection (cache, rate limits). Queues get their own connections. */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(@Inject(ENV) env: Env) {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }

  async ping(): Promise<void> {
    if (this.client.status === 'wait') await this.client.connect();
    const pong = await this.client.ping();
    if (pong !== 'PONG') throw new Error(`Unexpected Redis reply: ${pong}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end' && this.client.status !== 'wait')
      await this.client.quit();
  }
}
