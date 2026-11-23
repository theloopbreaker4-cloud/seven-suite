/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';
import { ToastService } from '../../ui/toast';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: boolean;
}
interface Overview {
  queues: QueueStats[];
  outbox: { pending: number; failing: number };
  tasks: { name: string; cron?: string; every?: number; next: number | null }[];
}
interface FailedJob {
  id: string;
  name: string;
  attemptsMade: number;
  failedReason: string;
  finishedOn?: number;
}

/**
 * System → Queues, for operators of this installation: queue health, the event outbox, scheduled
 * tasks (run now) and the dead letter (retry). Refreshes every 10 seconds.
 */
@Component({
  selector: 'sv-queues',
  imports: [TranslocoPipe, DatePipe],
  template: `
    <h1 class="mb-6 text-2xl font-semibold">{{ 'nav.queues' | transloco }}</h1>

    @if (denied()) {
      <p class="sv-card p-5 text-sm text-muted">
        {{ 'errors.not_platform_admin' | transloco }}
      </p>
    } @else if (data(); as d) {
      <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <section class="sv-card p-5">
          <p class="sv-label mb-1">{{ 'queues.outboxPending' | transloco }}</p>
          <p class="text-2xl font-semibold">{{ d.outbox.pending }}</p>
        </section>
        <section class="sv-card p-5">
          <p class="sv-label mb-1">{{ 'queues.outboxFailing' | transloco }}</p>
          <p
            class="text-2xl font-semibold"
            [class.text-danger]="d.outbox.failing > 0"
          >
            {{ d.outbox.failing }}
          </p>
        </section>
      </div>

      <section class="sv-card mb-6 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-border text-muted">
            <tr>
              <th class="px-4 py-2 font-medium">
                {{ 'queues.queue' | transloco }}
              </th>
              <th class="px-4 py-2 text-right font-medium">
                {{ 'queues.waiting' | transloco }}
              </th>
              <th class="px-4 py-2 text-right font-medium">
                {{ 'queues.active' | transloco }}
              </th>
              <th class="px-4 py-2 text-right font-medium">
                {{ 'queues.delayed' | transloco }}
              </th>
              <th class="px-4 py-2 text-right font-medium">
                {{ 'queues.completed' | transloco }}
              </th>
              <th class="px-4 py-2 text-right font-medium">
                {{ 'queues.failed' | transloco }}
              </th>
            </tr>
          </thead>
          <tbody>
            @for (q of d.queues; track q.name) {
              <tr class="border-b border-border last:border-0">
                <td class="px-4 py-2 font-mono text-xs">
                  {{ q.name }}
                  @if (q.paused) {
                    <span class="ml-1 text-danger"
                      >({{ 'queues.paused' | transloco }})</span
                    >
                  }
                </td>
                <td class="px-4 py-2 text-right">{{ q.waiting }}</td>
                <td class="px-4 py-2 text-right">{{ q.active }}</td>
                <td class="px-4 py-2 text-right">{{ q.delayed }}</td>
                <td class="px-4 py-2 text-right">{{ q.completed }}</td>
                <td class="px-4 py-2 text-right">
                  @if (q.failed > 0) {
                    <button
                      type="button"
                      class="sv-link text-danger"
                      (click)="showFailed(q.name)"
                    >
                      {{ q.failed }}
                    </button>
                  } @else {
                    0
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      @if (failed(); as f) {
        <section class="sv-card mb-6 p-5">
          <h2 class="mb-3 font-medium">
            {{ 'queues.deadLetter' | transloco }} —
            <span class="font-mono text-sm">{{ f.queue }}</span>
          </h2>
          <ul class="space-y-3 text-sm">
            @for (j of f.items; track j.id) {
              <li
                class="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3 last:border-0"
              >
                <div class="min-w-0">
                  <p class="font-mono text-xs">{{ j.name }} · {{ j.id }}</p>
                  <p class="break-words text-danger">{{ j.failedReason }}</p>
                  <p class="text-xs text-muted">
                    {{ 'queues.attempts' | transloco: { n: j.attemptsMade } }} ·
                    {{ j.finishedOn | date: 'short' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="sv-btn-ghost px-2 py-1"
                  (click)="retry(f.queue, j.id)"
                >
                  {{ 'queues.retry' | transloco }}
                </button>
              </li>
            } @empty {
              <li class="text-muted">—</li>
            }
          </ul>
        </section>
      }

      <section class="sv-card overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-border text-muted">
            <tr>
              <th class="px-4 py-2 font-medium">
                {{ 'queues.task' | transloco }}
              </th>
              <th class="px-4 py-2 font-medium">
                {{ 'queues.schedule' | transloco }}
              </th>
              <th class="px-4 py-2 font-medium">
                {{ 'queues.next' | transloco }}
              </th>
              <th class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            @for (t of d.tasks; track t.name) {
              <tr class="border-b border-border last:border-0">
                <td class="px-4 py-2 font-mono text-xs">{{ t.name }}</td>
                <td class="px-4 py-2 font-mono text-xs">
                  {{ t.cron ?? t.every + ' ms' }} UTC
                </td>
                <td class="px-4 py-2">
                  {{ t.next ? (t.next | date: 'short') : '—' }}
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    type="button"
                    class="sv-btn-ghost px-2 py-1"
                    [disabled]="running() === t.name"
                    (click)="runTask(t.name)"
                  >
                    {{
                      (running() === t.name ? 'common.wait' : 'queues.runNow')
                        | transloco
                    }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class QueuesPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly data = signal<Overview | null>(null);
  protected readonly denied = signal(false);
  protected readonly failed = signal<{
    queue: string;
    items: FailedJob[];
  } | null>(null);
  protected readonly running = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
    this.timer = setInterval(() => void this.load(), 10_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async load(): Promise<void> {
    try {
      this.data.set(
        await firstValueFrom(this.http.get<Overview>('api/v1/system/queues')),
      );
    } catch (e) {
      if (apiError(e).code === 'not_platform_admin') {
        this.denied.set(true);
        if (this.timer) clearInterval(this.timer);
      }
    }
  }

  async showFailed(queue: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ items: FailedJob[] }>(
        `api/v1/system/queues/${queue}/failed`,
      ),
    );
    this.failed.set({ queue, items: res.items });
  }

  async retry(queue: string, id: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `api/v1/system/queues/${queue}/jobs/${encodeURIComponent(id)}/retry`,
        {},
      ),
    );
    this.toast.success(this.t.translate('queues.retried'));
    await Promise.all([this.showFailed(queue), this.load()]);
  }

  async runTask(name: string): Promise<void> {
    this.running.set(name);
    try {
      const res = await firstValueFrom(
        this.http.post<{ result: unknown }>(
          `api/v1/system/queues/tasks/${name}/run`,
          {},
        ),
      );
      this.toast.success(`${name}: ${JSON.stringify(res.result)}`);
      await this.load();
    } catch (e) {
      this.toast.error(apiError(e).error);
    } finally {
      this.running.set(null);
    }
  }
}
