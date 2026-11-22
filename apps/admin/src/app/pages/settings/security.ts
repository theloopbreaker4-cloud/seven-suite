/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import QRCode from 'qrcode';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';
import { ToastService } from '../../ui/toast';

interface Status {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
}

/** The signed-in user's own sign-in security: two-factor sign-in and recovery codes. */
@Component({
  selector: 'sv-security',
  imports: [ReactiveFormsModule, TranslocoPipe, DatePipe, Field],
  template: `
    <h1 class="mb-6 text-2xl font-semibold">{{ 'nav.security' | transloco }}</h1>

    <section class="sv-card mb-6 max-w-2xl p-5">
      <h2 class="mb-1 font-medium">{{ 'security.twoFactor' | transloco }}</h2>
      <p class="mb-4 text-sm text-muted">{{ 'security.twoFactorHint' | transloco }}</p>

      @if (codes(); as list) {
        <div class="rounded-md border border-border bg-surface-2 p-4">
          <p class="mb-2 text-sm font-medium">{{ 'security.codesTitle' | transloco }}</p>
          <p class="mb-3 text-sm text-muted">{{ 'security.codesHint' | transloco }}</p>
          <ul class="mb-4 grid grid-cols-2 gap-1 font-mono text-sm">
            @for (c of list; track c) {
              <li>{{ c }}</li>
            }
          </ul>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="sv-btn-ghost" (click)="copyCodes(list)">{{ 'security.copy' | transloco }}</button>
            <button type="button" class="sv-btn-primary" (click)="codes.set(null)">{{ 'security.saved' | transloco }}</button>
          </div>
        </div>
      } @else if (status(); as s) {
        @if (s.enabled) {
          <p class="mb-4 text-sm">
            <span class="font-medium text-success">● {{ 'security.on' | transloco }}</span>
            <span class="text-muted"> · {{ s.enabledAt | date: 'mediumDate' }} ·
              {{ 'security.codesLeft' | transloco: { n: s.recoveryCodesLeft } }}</span>
          </p>
          @if (s.recoveryCodesLeft < 3) {
            <p class="mb-4 text-sm text-danger">{{ 'security.codesLow' | transloco }}</p>
          }
          <form class="mb-6 grid gap-x-4 md:grid-cols-[1fr_auto] md:items-start" [formGroup]="regenForm" (ngSubmit)="regenerate()" novalidate>
            <sv-field [label]="'auth.mfa.code' | transloco" for="regen-code" [error]="regenState.fields()['code'] ?? regenState.message()">
              <input id="regen-code" class="sv-input font-mono" inputmode="numeric" autocomplete="one-time-code" formControlName="code" />
            </sv-field>
            <button type="submit" class="sv-btn-ghost md:mt-6" [disabled]="regenState.busy() || regenForm.invalid">
              {{ 'security.newCodes' | transloco }}
            </button>
          </form>
          <h3 class="mb-3 text-sm font-medium">{{ 'security.turnOff' | transloco }}</h3>
          <form class="grid gap-x-4 md:grid-cols-[1fr_1fr_auto] md:items-start" [formGroup]="disableForm" (ngSubmit)="disable()" novalidate>
            <sv-field [label]="'auth.password' | transloco" for="off-password" [error]="offState.fields()['password']">
              <input id="off-password" type="password" class="sv-input" autocomplete="current-password" formControlName="password" />
            </sv-field>
            <sv-field [label]="'auth.mfa.code' | transloco" for="off-code" [error]="offState.fields()['code'] ?? offState.message()">
              <input id="off-code" class="sv-input font-mono" autocomplete="one-time-code" formControlName="code" />
            </sv-field>
            <button type="submit" class="sv-btn-danger md:mt-6" [disabled]="offState.busy() || disableForm.invalid">
              {{ 'security.turnOff' | transloco }}
            </button>
          </form>
        } @else if (setup(); as st) {
          <ol class="mb-4 list-decimal space-y-2 pl-5 text-sm">
            <li>{{ 'security.step1' | transloco }}</li>
            <li>{{ 'security.step2' | transloco }}</li>
          </ol>
          <div class="mb-4 flex flex-wrap items-start gap-5">
            @if (qr()) {
              <img [src]="qr()" width="180" height="180" class="rounded-md border border-border bg-white p-2" [alt]="'security.qrAlt' | transloco" />
            }
            <div class="text-sm">
              <p class="mb-1 text-muted">{{ 'security.manual' | transloco }}</p>
              <p class="break-all font-mono">{{ st.secret }}</p>
            </div>
          </div>
          <form class="grid gap-x-4 md:grid-cols-[12rem_auto] md:items-start" [formGroup]="enableForm" (ngSubmit)="enable()" novalidate>
            <sv-field [label]="'auth.mfa.code' | transloco" for="enable-code" [error]="enableState.fields()['code'] ?? enableState.message()">
              <input id="enable-code" class="sv-input font-mono tracking-widest" inputmode="numeric" autocomplete="one-time-code" maxlength="6" formControlName="code" />
            </sv-field>
            <button type="submit" class="sv-btn-primary md:mt-6" [disabled]="enableState.busy() || enableForm.invalid">
              {{ 'security.confirm' | transloco }}
            </button>
          </form>
        } @else {
          <p class="mb-4 text-sm"><span class="text-muted">○ {{ 'security.off' | transloco }}</span></p>
          @if (startState.message()) {
            <p class="mb-4 text-sm text-danger" role="alert">{{ startState.message() }}</p>
          }
          <button type="button" class="sv-btn-primary" [disabled]="startState.busy()" (click)="start()">
            {{ 'security.turnOn' | transloco }}
          </button>
        }
      }
    </section>
  `,
})
export class SecurityPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly store = inject(AuthStore);

  protected readonly status = signal<Status | null>(null);
  protected readonly setup = signal<{ secret: string; otpauthUrl: string } | null>(null);
  protected readonly qr = signal<string | null>(null);
  /** Recovery codes, shown once right after they are created. */
  protected readonly codes = signal<string[] | null>(null);

  protected readonly startState = new FormState();
  protected readonly enableState = new FormState();
  protected readonly offState = new FormState();
  protected readonly regenState = new FormState();
  protected readonly enableForm = this.fb.group({ code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]] });
  protected readonly disableForm = this.fb.group({ password: ['', Validators.required], code: ['', [Validators.required, Validators.minLength(6)]] });
  protected readonly regenForm = this.fb.group({ code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]] });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.status.set(await firstValueFrom(this.http.get<Status>('api/v1/auth/2fa')));
  }

  async start(): Promise<void> {
    await this.startState.run(async () => {
      const res = await firstValueFrom(
        this.http.post<{ secret: string; otpauthUrl: string }>('api/v1/auth/2fa/setup', {}),
      );
      this.setup.set(res);
      this.qr.set(await QRCode.toDataURL(res.otpauthUrl, { margin: 0, width: 180 }));
    });
  }

  async enable(): Promise<void> {
    const ok = await this.enableState.run(async () => {
      const res = await firstValueFrom(
        this.http.post<{ recoveryCodes: string[] }>('api/v1/auth/2fa/enable', this.enableForm.getRawValue()),
      );
      this.codes.set(res.recoveryCodes);
    });
    if (!ok) return;
    this.setup.set(null);
    this.qr.set(null);
    this.enableForm.reset();
    await Promise.all([this.load(), this.store.loadMe()]);
    this.toast.success(this.t.translate('security.enabled'));
  }

  async disable(): Promise<void> {
    const ok = await this.offState.run(() =>
      firstValueFrom(this.http.post('api/v1/auth/2fa/disable', this.disableForm.getRawValue())),
    );
    if (!ok) return;
    this.disableForm.reset();
    await Promise.all([this.load(), this.store.loadMe()]);
    this.toast.success(this.t.translate('security.disabled'));
  }

  async regenerate(): Promise<void> {
    const ok = await this.regenState.run(async () => {
      const res = await firstValueFrom(
        this.http.post<{ recoveryCodes: string[] }>('api/v1/auth/2fa/recovery-codes', this.regenForm.getRawValue()),
      );
      this.codes.set(res.recoveryCodes);
    });
    if (ok) {
      this.regenForm.reset();
      await this.load();
    }
  }

  async copyCodes(list: string[]): Promise<void> {
    await navigator.clipboard.writeText(list.join('\n')).catch(() => undefined);
    this.toast.success(this.t.translate('security.copied'));
  }
}
