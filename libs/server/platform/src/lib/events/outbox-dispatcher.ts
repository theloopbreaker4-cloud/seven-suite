/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { EVENT_JOB_OPTIONS, QUEUES, QueueService } from '../queue/queue.service';

interface OutboxRow {
  id: string;
  org_id: string | null;
  name: string;
  payload: unknown;
  occurred_at: Date;
}

/** After this many failed hand-overs to Redis an event is left for a human (dead letter). */
export const OUTBOX_MAX_ATTEMPTS = 10;

/**
 * Moves committed outbox rows to the events queue. Runs in the worker; several workers may run
 * at once — `FOR UPDATE SKIP LOCKED` gives each row to exactly one of them. The job id is the
 * event id, so a crash between "queued" and "marked dispatched" cannot create a duplicate job.
 */
@Injectable()
export class OutboxDispatcher implements OnApplicationShutdown {
  private readonly logger = new Logger(OutboxDispatcher.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
  ) {}

  /** Dispatch up to `limit` pending events; returns how many were queued. */
  async dispatchBatch(limit = 100): Promise<number> {
    const queue = this.queues.queue(QUEUES.events);
    return this.prisma.system.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<OutboxRow[]>`
        SELECT id, org_id, name, payload, occurred_at
        FROM platform.outbox_event
        WHERE dispatched_at IS NULL AND attempts < ${OUTBOX_MAX_ATTEMPTS}
        ORDER BY occurred_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED`;
      let queued = 0;
      for (const row of rows) {
        try {
          const payload = (row.payload ?? {}) as Record<string, unknown>;
          await queue.add(
            row.name,
            { ...payload, orgId: row.org_id, occurredAt: row.occurred_at.toISOString() },
            { ...EVENT_JOB_OPTIONS, jobId: row.id },
          );
          await tx.$executeRaw`
            UPDATE platform.outbox_event SET dispatched_at = now(), attempts = attempts + 1, last_error = NULL
            WHERE id = ${row.id}::uuid`;
          queued++;
        } catch (err) {
          const message = (err as Error).message.slice(0, 1000);
          await tx.$executeRaw`
            UPDATE platform.outbox_event SET attempts = attempts + 1, last_error = ${message}
            WHERE id = ${row.id}::uuid`;
          this.logger.warn(`outbox ${row.name} ${row.id} not queued: ${message}`);
        }
      }
      return queued;
    }, { timeout: 30_000 });
  }

  /** Poll every `intervalMs` (worker process only). */
  start(intervalMs = 1_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), intervalMs);
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      // Drain quickly after a burst, then go back to polling.
      while ((await this.dispatchBatch()) === 100);
    } catch (err) {
      this.logger.error(`outbox dispatch failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
  }
}
