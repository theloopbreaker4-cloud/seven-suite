/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/** Queue names. Every queue the platform knows about is listed here (stats, admin). */
export const QUEUES = {
  /** Domain events delivered from the outbox to consumers. */
  events: 'seven-events',
  /** Repeatable maintenance jobs (cleanup, scheduled reports…). */
  scheduler: 'seven-scheduler',
} as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/** Delivery policy for events: retried with exponential backoff, then kept as failed (dead letter). */
export const EVENT_JOB_OPTIONS: JobsOptions = {
  attempts: 8,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 24 * 3600, count: 5_000 },
  removeOnFail: false,
};

/** BullMQ needs its own connections, with no per-command retry limit for blocking calls. */
export function bullConnection(env: Pick<Env, 'REDIS_URL'>): ConnectionOptions {
  return { url: env.REDIS_URL, maxRetriesPerRequest: null };
}

/** Options every Queue/Worker of this deployment shares. */
export function bullOptions(env: Pick<Env, 'REDIS_URL' | 'QUEUE_PREFIX'>) {
  return { connection: bullConnection(env), prefix: env.QUEUE_PREFIX };
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: boolean;
}

export interface FailedJobView {
  id: string;
  name: string;
  attemptsMade: number;
  failedReason: string;
  timestamp: number;
  finishedOn?: number;
}

/** Producer side and admin view of the queues (the worker owns the consumers). */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  queue(name: QueueName): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, bullOptions(this.env));
      this.queues.set(name, q);
    }
    return q;
  }

  async stats(): Promise<QueueStats[]> {
    return Promise.all(
      Object.values(QUEUES).map(async (name) => {
        const q = this.queue(name);
        const c = await q.getJobCounts(
          'waiting',
          'active',
          'delayed',
          'completed',
          'failed',
        );
        return {
          name,
          waiting: c['waiting'] ?? 0,
          active: c['active'] ?? 0,
          delayed: c['delayed'] ?? 0,
          completed: c['completed'] ?? 0,
          failed: c['failed'] ?? 0,
          paused: await q.isPaused(),
        };
      }),
    );
  }

  /** The dead letter: jobs that used up every retry. */
  async failed(name: QueueName, limit = 50): Promise<FailedJobView[]> {
    const jobs = await this.queue(name).getFailed(0, Math.max(0, limit - 1));
    return jobs.map((j) => ({
      id: String(j.id),
      name: j.name,
      attemptsMade: j.attemptsMade,
      failedReason: (j.failedReason ?? '').slice(0, 500),
      timestamp: j.timestamp,
      finishedOn: j.finishedOn,
    }));
  }

  /** Put a failed job back in line (after the cause was fixed). */
  async retry(name: QueueName, jobId: string): Promise<boolean> {
    const job = await this.queue(name).getJob(jobId);
    if (!job || !(await job.isFailed())) return false;
    await job.retry('failed');
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
