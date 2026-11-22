/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../core/auth/auth.store';
import { safeNext } from '../../core/auth/guards';
import { AuthLayout } from '../../layout/auth-layout';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';

@Component({
  selector: 'sv-login',
  imports: [AuthLayout, Field, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    <sv-auth-layout
      [title]="'auth.login.title' | transloco"
      [subtitle]="'auth.login.subtitle' | transloco"
    >
      @if (demo(); as d) {
        <div
          class="mb-5 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm"
        >
          <p class="mb-1 font-medium">{{ 'auth.demo.title' | transloco }}</p>
          <p class="mb-2 text-muted">{{ 'auth.demo.hint' | transloco }}</p>
          <p class="mb-3 font-mono text-xs">{{ d.email }} / {{ d.password }}</p>
          <button
            type="button"
            class="sv-btn-primary w-full"
            [disabled]="state.busy()"
            (click)="useDemo(d.email, d.password)"
          >
            {{ 'auth.demo.signIn' | transloco }}
          </button>
        </div>
      }
      @if (mfaToken()) {
        <form [formGroup]="codeForm" (ngSubmit)="submitCode()" novalidate>
          <p class="mb-4 text-sm text-muted">{{ 'auth.mfa.hint' | transloco }}</p>
          <sv-field
            [label]="'auth.mfa.code' | transloco"
            for="code"
            [error]="state.fields()['code']"
          >
            <input
              id="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              class="sv-input font-mono tracking-widest"
              formControlName="code"
              maxlength="32"
              required
            />
          </sv-field>
          <p class="mb-4 text-xs text-muted">{{ 'auth.mfa.recoveryHint' | transloco }}</p>
          @if (state.message()) {
            <p class="mb-4 rounded-md bg-surface-2 px-3 py-2 text-sm text-danger" role="alert">
              {{ state.message() }}
            </p>
          }
          <button type="submit" class="sv-btn-primary w-full" [disabled]="state.busy() || codeForm.invalid">
            {{ (state.busy() ? 'common.wait' : 'auth.mfa.submit') | transloco }}
          </button>
          <button type="button" class="sv-link mt-4 block w-full text-center text-sm" (click)="restart()">
            {{ 'auth.mfa.back' | transloco }}
          </button>
        </form>
      } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <sv-field
          [label]="'auth.email' | transloco"
          for="email"
          [error]="state.fields()['email']"
        >
          <input
            id="email"
            type="email"
            autocomplete="username"
            class="sv-input"
            formControlName="email"
            required
          />
        </sv-field>
        <sv-field
          [label]="'auth.password' | transloco"
          for="password"
          [error]="state.fields()['password']"
        >
          <input
            id="password"
            type="password"
            autocomplete="current-password"
            class="sv-input"
            formControlName="password"
            required
          />
        </sv-field>
        <div class="mb-4 text-right text-sm">
          <a class="sv-link" routerLink="/forgot-password">{{
            'auth.login.forgot' | transloco
          }}</a>
        </div>
        @if (state.message()) {
          <p
            class="mb-4 rounded-md bg-surface-2 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {{ state.message() }}
          </p>
        }
        <button
          type="submit"
          class="sv-btn-primary w-full"
          [disabled]="state.busy() || form.invalid"
        >
          {{ (state.busy() ? 'common.wait' : 'auth.login.submit') | transloco }}
        </button>
      </form>
      }
      @if (!demo()) {
        <p class="mt-5 text-center text-sm text-muted">
          {{ 'auth.login.noAccount' | transloco }}
          <a class="sv-link" routerLink="/signup">{{
            'auth.signup.link' | transloco
          }}</a>
        </p>
      }
    </sv-auth-layout>
  `,
})
export class LoginPage {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly state = new FormState();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly codeForm = inject(FormBuilder).nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6)]],
  });
  /** Set after a correct password on an account with two-factor sign-in. */
  protected readonly mfaToken = signal<string | null>(null);

  /** Set on the public demo instance: the shared account to sign in with. */
  protected readonly demo = signal<{ email: string; password: string } | null>(
    null,
  );

  constructor() {
    inject(HttpClient)
      .get<{ enabled: boolean; email?: string; password?: string }>(
        'api/v1/auth/demo',
      )
      .subscribe({
        next: (d) => {
          if (d.enabled && d.email && d.password)
            this.demo.set({ email: d.email, password: d.password });
        },
        error: () => undefined,
      });
  }

  useDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    void this.submit();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    let challenge: string | null = null;
    const ok = await this.state.run(async () => {
      challenge = await this.store.login(this.form.getRawValue());
    });
    if (!ok) return;
    if (challenge) {
      this.mfaToken.set(challenge);
      return;
    }
    await this.done();
  }

  async submitCode(): Promise<void> {
    const token = this.mfaToken();
    if (!token || this.codeForm.invalid) return;
    const ok = await this.state.run(() =>
      this.store.completeMfa(token, this.codeForm.getRawValue().code.trim()),
    );
    if (ok) await this.done();
    // An expired challenge (5 min) means starting over with the password.
    else if (this.state.message() && !this.state.fields()['code']) this.codeForm.reset();
  }

  restart(): void {
    this.mfaToken.set(null);
    this.codeForm.reset();
    this.state.message.set(null);
  }

  private async done(): Promise<void> {
    await this.router.navigateByUrl(
      safeNext(this.route.snapshot.queryParamMap.get('next')),
    );
  }
}
