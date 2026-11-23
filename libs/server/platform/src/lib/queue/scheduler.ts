/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { RequestContext } from '../context/request-context';
import { bullOptions, QUEUES, QueueService } from './queue.service';

export interface ScheduledTask {
  /** Stable id, also the job name: `<module>.<what>` (e.g. `platform.tokens-cleanup`). */
  name: string;
  /** Cron pattern (UTC), e.g. `15 3 * * *` — or `every` milliseconds. */
  cron?: string;
  every?: number;
  run: () => Promise<unknown>;
}

/**
 * Repeatable maintenance jobs. Modules `register()` tasks at boot; the worker `start()`s:
 * schedules are upserted in Redis (idempotent — several workers or restarts don't duplicate
 * them), and BullMQ guarantees one run per tick across all workers. Schedules that are no longer
 * registered are removed, so renaming a task doesn't leave a ghost behind.
 */
@Injectable()
export class SchedulerService implements OnApplicationShutdown {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly tasks = new Map<string, ScheduledTask>();
  private worker?: Worker;

  constructor(
    private readonly queues: QueueService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  register(task: ScheduledTask): void {
    if (!task.cron === !task.every)
      throw new Error(`${task.name}: give exactly one of cron / every`);
    if (this.tasks.has(task.name))
      throw new Error(`Duplicate scheduled task ${task.name}`);
    this.tasks.set(task.name, task);
  }

  list(): { name: string; cron?: string; every?: number }[] {
    return [...this.tasks.values()].map(({ name, cron, every }) => ({
      name,
      cron,
      every,
    }));
  }

  /** Run one task now, outside its schedule (operators, tests). */
  async runNow(name: string): Promise<unknown> {
    const task = this.tasks.get(name);
    if (!task) throw new Error(`Unknown task ${name}`);
    return RequestContext.run(
      { requestId: `task:${name}:${Date.now()}`, actorType: 'system' },
      task.run,
    );
  }

  async start(): Promise<void> {
    if (this.worker) return;
    const queue = this.queues.queue(QUEUES.scheduler);
    for (const t of this.tasks.values()) {
      await queue.upsertJobScheduler(
        t.name,
        t.cron ? { pattern: t.cron, tz: 'UTC' } : { every: t.every ?? 60_000 },
        {
          name: t.name,
          opts: {
            removeOnComplete: 50,
            removeOnFail: 200,
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
          },
        },
      );
    }
    for (const s of await queue.getJobSchedulers()) {
      if (s.key && !this.tasks.has(s.key))
        await queue.removeJobScheduler(s.key);
    }
    this.worker = new Worker(
      QUEUES.scheduler,
      async (job: Job) => {
        const started = Date.now();
        const result = await this.runNow(job.name);
        this.logger.log(
          `task ${job.name} done in ${Date.now() - started} ms ${result === undefined ? '' : JSON.stringify(result)}`,
        );
        return result;
      },
      { ...bullOptions(this.env), concurrency: 1 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.warn(`task ${job?.name} failed: ${err.message}`),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
