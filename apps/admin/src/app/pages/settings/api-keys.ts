/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { hasPermission, PERMISSION_CATALOG } from '@seven/shared';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import { CanDirective } from '../../core/auth/can.directive';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';
import { ToastService } from '../../ui/toast';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  active: boolean;
}

/** Organization API keys for integrations. The secret is shown once, at creation. */
@Component({
  selector: 'sv-api-keys',
  imports: [ReactiveFormsModule, TranslocoPipe, DatePipe, Field, CanDirective],
  template: `
    <h1 class="mb-2 text-2xl font-semibold">{{ 'nav.apiKeys' | transloco }}</h1>
    <p class="mb-6 max-w-2xl text-sm text-muted">{{ 'apiKeys.hint' | transloco }}</p>

    @if (created(); as c) {
      <section class="sv-card mb-6 border-success p-5" role="status">
        <p class="mb-2 font-medium">{{ 'apiKeys.createdTitle' | transloco: { name: c.name } }}</p>
        <p class="mb-3 text-sm text-muted">{{ 'apiKeys.createdHint' | transloco }}</p>
        <p class="mb-3 break-all rounded-md bg-surface-2 p-3 font-mono text-sm">{{ c.key }}</p>
        <div class="flex gap-2">
          <button type="button" class="sv-btn-ghost" (click)="copy(c.key)">{{ 'security.copy' | transloco }}</button>
          <button type="button" class="sv-btn-primary" (click)="created.set(null)">{{ 'security.saved' | transloco }}</button>
        </div>
      </section>
    }

    <section *svCan="'platform:api_key:create'" class="sv-card mb-6 p-5">
      <h2 class="mb-4 font-medium">{{ 'apiKeys.new' | transloco }}</h2>
      <form [formGroup]="form" (ngSubmit)="create()" novalidate>
        <div class="grid gap-x-4 md:grid-cols-[1fr_12rem]">
          <sv-field [label]="'apiKeys.name' | transloco" for="key-name" [error]="state.fields()['name']">
            <input id="key-name" class="sv-input" formControlName="name" maxlength="80" />
          </sv-field>
          <sv-field [label]="'apiKeys.expires' | transloco" for="key-expiry" [error]="state.fields()['expiresInDays']">
            <select id="key-expiry" class="sv-input" formControlName="expiresInDays">
              <option [ngValue]="30">{{ 'apiKeys.days' | transloco: { n: 30 } }}</option>
              <option [ngValue]="90">{{ 'apiKeys.days' | transloco: { n: 90 } }}</option>
              <option [ngValue]="365">{{ 'apiKeys.days' | transloco: { n: 365 } }}</option>
              <option [ngValue]="0">{{ 'apiKeys.never' | transloco }}</option>
            </select>
          </sv-field>
        </div>
        <fieldset class="mb-4">
          <legend class="sv-label mb-2">{{ 'apiKeys.permissions' | transloco }}</legend>
          <div class="grid gap-1 sm:grid-cols-2">
            @for (p of grantable(); track p) {
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [checked]="picked().has(p)" (change)="toggle(p)" />
                <span class="font-mono text-xs">{{ p }}</span>
              </label>
            }
          </div>
          @if (state.fields()['permissions']) {
            <p class="mt-1 text-sm text-danger">{{ state.fields()['permissions'] }}</p>
          }
        </fieldset>
        @if (state.message()) {
          <p class="mb-4 text-sm text-danger" role="alert">{{ state.message() }}</p>
        }
        <button type="submit" class="sv-btn-primary" [disabled]="state.busy() || form.invalid || picked().size === 0">
          {{ 'apiKeys.create' | transloco }}
        </button>
      </form>
    </section>

    <section class="sv-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-border text-muted">
          <tr>
            <th class="px-4 py-2 font-medium">{{ 'apiKeys.name' | transloco }}</th>
            <th class="px-4 py-2 font-medium">{{ 'apiKeys.key' | transloco }}</th>
            <th class="px-4 py-2 font-medium">{{ 'apiKeys.permissions' | transloco }}</th>
            <th class="px-4 py-2 font-medium">{{ 'apiKeys.lastUsed' | transloco }}</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          @for (k of keys(); track k.id) {
            <tr class="border-b border-border last:border-0" [class.opacity-50]="!k.active">
              <td class="px-4 py-2">
                {{ k.name }}
                @if (!k.active) {
                  <span class="ml-1 text-xs text-muted">({{ (k.revokedAt ? 'apiKeys.revoked' : 'apiKeys.expired') | transloco }})</span>
                }
              </td>
              <td class="px-4 py-2 font-mono text-xs">{{ k.prefix }}…</td>
              <td class="px-4 py-2 font-mono text-xs">{{ k.permissions.join(', ') }}</td>
              <td class="px-4 py-2 text-muted">{{ k.lastUsedAt ? (k.lastUsedAt | date: 'short') : '—' }}</td>
              <td class="px-4 py-2 text-right">
                @if (k.active) {
                  <button *svCan="'platform:api_key:delete'" type="button" class="sv-btn-danger px-2 py-1" (click)="revoke(k)">
                    {{ 'members.revoke' | transloco }}
                  </button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="px-4 py-6 text-center text-muted">{{ 'apiKeys.empty' | transloco }}</td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class ApiKeysPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly store = inject(AuthStore);

  protected readonly keys = signal<ApiKey[]>([]);
  protected readonly created = signal<{ name: string; key: string } | null>(null);
  protected readonly picked = signal(new Set<string>());
  protected readonly state = new FormState();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    expiresInDays: [90],
  });
  /**
   * Only what you have yourself can be put on a key — minus key management, which keys can
   * never use (those routes are for people only).
   */
  protected readonly grantable = computed(() =>
    PERMISSION_CATALOG.map((p) => p.key).filter(
      (k) => !k.startsWith('platform:api_key:') && hasPermission(this.store.permissions(), k),
    ),
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const res = await firstValueFrom(this.http.get<{ items: ApiKey[] }>('api/v1/api-keys'));
    this.keys.set(res.items);
  }

  toggle(p: string): void {
    const next = new Set(this.picked());
    if (next.has(p)) next.delete(p);
    else next.add(p);
    this.picked.set(next);
  }

  async create(): Promise<void> {
    const { name, expiresInDays } = this.form.getRawValue();
    const ok = await this.state.run(async () => {
      const res = await firstValueFrom(
        this.http.post<{ name: string; key: string }>('api/v1/api-keys', {
          name,
          permissions: [...this.picked()],
          ...(expiresInDays ? { expiresInDays } : {}),
        }),
      );
      this.created.set({ name: res.name, key: res.key });
    });
    if (!ok) return;
    this.form.reset({ name: '', expiresInDays: 90 });
    this.picked.set(new Set());
    await this.load();
  }

  async revoke(k: ApiKey): Promise<void> {
    if (!confirm(this.t.translate('apiKeys.confirmRevoke', { name: k.name }))) return;
    try {
      await firstValueFrom(this.http.delete(`api/v1/api-keys/${k.id}`));
      this.toast.success(this.t.translate('apiKeys.revokedToast'));
      await this.load();
    } catch (e) {
      this.toast.error(apiError(e).error);
    }
  }

  async copy(text: string): Promise<void> {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    this.toast.success(this.t.translate('security.copied'));
  }
}
