/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthLayout } from '../../layout/auth-layout';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';

@Component({
  selector: 'sv-forgot-password',
  imports: [AuthLayout, Field, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    <sv-auth-layout
      [title]="'auth.forgot.title' | transloco"
      [subtitle]="'auth.forgot.subtitle' | transloco"
    >
      @if (sent()) {
        <p class="rounded-md bg-surface-2 px-3 py-3 text-sm">
          {{ 'auth.forgot.sent' | transloco }}
        </p>
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
              autocomplete="email"
              class="sv-input"
              formControlName="email"
              required
            />
          </sv-field>
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
            {{
              (state.busy() ? 'common.wait' : 'auth.forgot.submit') | transloco
            }}
          </button>
        </form>
      }
      <p class="mt-5 text-center text-sm">
        <a class="sv-link" routerLink="/login">{{
          'auth.backToLogin' | transloco
        }}</a>
      </p>
    </sv-auth-layout>
  `,
})
export class ForgotPasswordPage {
  private readonly http = inject(HttpClient);
  protected readonly state = new FormState();
  protected readonly sent = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const ok = await this.state.run(() =>
      firstValueFrom(
        this.http.post('api/v1/auth/password/forgot', this.form.getRawValue()),
      ),
    );
    if (ok) this.sent.set(true);
  }
}
