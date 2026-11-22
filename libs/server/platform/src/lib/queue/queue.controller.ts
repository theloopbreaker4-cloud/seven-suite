/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { CurrentAuth, UserOnly } from '../auth/decorators';
import type { AuthContext } from '../auth/tokens';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { PrismaService } from '../db/prisma.service';
import { DomainError } from '../errors/domain-error';
import { QUEUES, QueueService, type QueueName } from './queue.service';
import { SchedulerService } from './scheduler';

/**
 * Queue health for the operators of this installation (PLATFORM_ADMINS). Queues are shared by
 * every tenant, so this is deliberately NOT tied to an organization role.
 */
@UserOnly()
@Controller('system/queues')
export class QueueController {
  constructor(
    private readonly queues: QueueService,
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get()
  async stats(@CurrentAuth() auth: AuthContext) {
    await this.assertOperator(auth);
    const outbox = await this.prisma.system.outboxEvent.groupBy({
      by: ['dispatchedAt'],
      _count: true,
      where: { dispatchedAt: null },
    });
    const stuck = await this.prisma.system.outboxEvent.count({
      where: { dispatchedAt: null, lastError: { not: null } },
    });
    const schedules = await this.queues.queue(QUEUES.scheduler).getJobSchedulers();
    return {
      queues: await this.queues.stats(),
      outbox: { pending: outbox.reduce((n, g) => n + g._count, 0), failing: stuck },
      tasks: this.scheduler.list().map((t) => ({
        ...t,
        next: schedules.find((s) => s.key === t.name)?.next ?? null,
      })),
    };
  }

  /** Run a scheduled task right now (it also keeps its normal schedule). */
  @Post('tasks/:name/run')
  @HttpCode(200)
  async runTask(@CurrentAuth() auth: AuthContext, @Param('name') name: string) {
    await this.assertOperator(auth);
    if (!this.scheduler.list().some((t) => t.name === name)) throw DomainError.notFound('Unknown task');
    return { result: (await this.scheduler.runNow(name)) ?? null };
  }

  @Get(':name/failed')
  async failed(@CurrentAuth() auth: AuthContext, @Param('name') name: string) {
    await this.assertOperator(auth);
    return { items: await this.queues.failed(this.queueName(name)) };
  }

  @Post(':name/jobs/:id/retry')
  @HttpCode(204)
  async retry(@CurrentAuth() auth: AuthContext, @Param('name') name: string, @Param('id') id: string) {
    await this.assertOperator(auth);
    if (!(await this.queues.retry(this.queueName(name), id))) throw DomainError.notFound('Failed job not found');
  }

  private queueName(name: string): QueueName {
    const known = Object.values(QUEUES) as string[];
    if (!known.includes(name)) throw DomainError.notFound('Unknown queue');
    return name as QueueName;
  }

  private async assertOperator(auth: AuthContext): Promise<void> {
    const user = await this.prisma.system.user.findUnique({ where: { id: auth.userId }, select: { email: true } });
    if (!user || !isPlatformAdmin(this.env, user.email))
      throw DomainError.forbidden('Only operators of this installation', 'not_platform_admin');
  }
}

export function isPlatformAdmin(env: Pick<Env, 'PLATFORM_ADMINS'>, email: string): boolean {
  return env.PLATFORM_ADMINS.includes(email.toLowerCase());
}
