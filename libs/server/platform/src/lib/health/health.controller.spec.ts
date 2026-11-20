/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../db/prisma.service';
import type { RedisService } from '../redis/redis.service';

const make = (db: () => Promise<void>, redis: () => Promise<void>) =>
  new HealthController(
    { ping: db } as unknown as PrismaService,
    { ping: redis } as unknown as RedisService,
  );

describe('HealthController', () => {
  const ok = () => Promise.resolve();
  const down = () => Promise.reject(new Error('down'));

  it('live does not touch dependencies', () => {
    expect(make(down, down).live()).toEqual({ status: 'ok' });
  });

  it('ready is ok when database and redis answer', async () => {
    await expect(make(ok, ok).ready()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
      redis: 'ok',
    });
  });

  it('ready answers 503 naming the failed dependency', async () => {
    try {
      await make(ok, down).ready();
      fail('expected 503');
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceUnavailableException);
      expect((e as ServiceUnavailableException).getResponse()).toEqual({
        status: 'fail',
        database: 'ok',
        redis: 'fail',
      });
    }
  });
});
