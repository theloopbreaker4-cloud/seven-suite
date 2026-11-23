/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { OrgModule } from '@seven/shared';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastService } from '../../ui/toast';

/** Settings → Modules: switch parts of the suite on and off for this organization. */
@Component({
  selector: 'sv-modules',
  imports: [TranslocoPipe],
  template: `
    <h1 class="mb-2 text-2xl font-semibold">{{ 'nav.modules' | transloco }}</h1>
    <p class="mb-6 max-w-2xl text-sm text-muted">
      {{ 'modules.hint' | transloco }}
    </p>
    <div class="grid gap-4 md:grid-cols-2">
      @for (m of modules(); track m.id) {
        <section class="sv-card flex flex-col p-5">
          <div class="mb-2 flex items-center justify-between gap-3">
            <h2 class="font-medium">{{ m.name }}</h2>
            @if (m.alwaysOn) {
              <span class="text-xs text-muted">{{
                'modules.alwaysOn' | transloco
              }}</span>
            } @else if (canEdit) {
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="m.enabled"
                [attr.aria-label]="m.name"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                [class.bg-primary]="m.enabled"
                [class.bg-surface-2]="!m.enabled"
                [disabled]="busy() === m.id"
                (click)="toggle(m)"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                  [class.left-0.5]="!m.enabled"
                  [class.left-5]="m.enabled"
                ></span>
              </button>
            } @else {
              <span class="text-xs" [class.text-success]="m.enabled">{{
                (m.enabled ? 'security.on' : 'security.off') | transloco
              }}</span>
            }
          </div>
          <p class="mb-3 text-sm text-muted">{{ m.description }}</p>
          @if (m.requires.length) {
            <p class="text-xs text-muted">
              {{
                'modules.requires' | transloco: { list: m.requires.join(', ') }
              }}
            </p>
          }
          @if (m.requiredBy.length) {
            <p class="text-xs text-muted">
              {{
                'modules.requiredBy'
                  | transloco: { list: m.requiredBy.join(', ') }
              }}
            </p>
          }
        </section>
      }
    </div>
  `,
})
export class ModulesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  protected readonly canEdit = inject(AuthStore).can(
    'platform:settings:update',
  );
  protected readonly modules = signal<OrgModule[]>([]);
  protected readonly busy = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.modules.set(
      (
        await firstValueFrom(
          this.http.get<{ items: OrgModule[] }>('api/v1/org/modules'),
        )
      ).items,
    );
  }

  async toggle(m: OrgModule): Promise<void> {
    this.busy.set(m.id);
    try {
      const res = await firstValueFrom(
        this.http.put<{ items: OrgModule[] }>(`api/v1/org/modules/${m.id}`, {
          enabled: !m.enabled,
        }),
      );
      this.modules.set(res.items);
    } catch (e) {
      const err = apiError(e);
      const key = `errors.${err.code}`;
      const text = this.t.translate(key);
      this.toast.error(text !== key ? `${text} ${err.error}` : err.error);
    } finally {
      this.busy.set(null);
    }
  }
}
