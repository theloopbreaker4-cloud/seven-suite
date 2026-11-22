/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { OutboxDispatcher } from '../events/outbox-dispatcher';
import { SchedulerService } from './scheduler';

/** Housekeeping the platform needs on every installation (times are UTC). */
@Injectable()
export class PlatformTasks implements OnModuleInit {
  constructor(
    private readonly scheduler: SchedulerService,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxDispatcher,
  ) {}

  onModuleInit(): void {
    this.scheduler.register({
      name: 'platform.outbox-prune',
      cron: '20 * * * *',
      run: () => this.outbox.prune(),
    });
    this.scheduler.register({
      name: 'platform.tokens-cleanup',
      cron: '40 3 * * *',
      run: () => this.cleanupTokens(),
    });
  }

  /**
   * Expired sessions and one-time tokens are useless but pile up. Refresh tokens are kept until
   * they expire (a rotated one is still needed to detect reuse of its family).
   */
  async cleanupTokens(): Promise<Record<string, number>> {
    const db = this.prisma.system;
    const dayAgo = new Date(Date.now() - 86_400_000);
    const monthAgo = new Date(Date.now() - 30 * 86_400_000);
    const [refresh, oneTime, invitations] = await Promise.all([
      db.refreshToken.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
      db.userToken.deleteMany({ where: { OR: [{ expiresAt: { lt: dayAgo } }, { usedAt: { lt: monthAgo } }] } }),
      db.invitation.deleteMany({
        where: {
          OR: [
            { acceptedAt: null, expiresAt: { lt: monthAgo } },
            { revokedAt: { lt: monthAgo } },
            { acceptedAt: { lt: monthAgo } },
          ],
        },
      }),
    ]);
    return { refresh: refresh.count, oneTime: oneTime.count, invitations: invitations.count };
  }
}
