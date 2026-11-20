/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../auth/decorators';
import { PrismaService } from '../db/prisma.service';
import { RedisService } from '../redis/redis.service';

type Check = 'ok' | 'fail';

/**
 * Probes for the orchestrator and the deploy script.
 *  live  — the process is up (no dependencies checked);
 *  ready — PostgreSQL and Redis answer; 503 otherwise, with which one failed.
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const [database, redis] = await Promise.all([
      this.check(() => this.prisma.ping()),
      this.check(() => this.redis.ping()),
    ]);
    const body = {
      status: database === 'ok' && redis === 'ok' ? 'ok' : 'fail',
      database,
      redis,
    };
    if (body.status !== 'ok') throw new ServiceUnavailableException(body);
    return body;
  }

  private async check(fn: () => Promise<void>): Promise<Check> {
    try {
      await fn();
      return 'ok';
    } catch {
      return 'fail';
    }
  }
}
