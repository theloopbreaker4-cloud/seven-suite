/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthLayout } from '../../layout/auth-layout';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';

@Component({
  selector: 'sv-reset-password',
  imports: [AuthLayout, Field, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    <sv-auth-layout [title]="'auth.reset.title' | transloco">
      @if (done()) {
        <p class="mb-4 rounded-md bg-surface-2 px-3 py-3 text-sm">
          {{ 'auth.reset.done' | transloco }}
        </p>
        <a class="sv-btn-primary w-full" routerLink="/login">{{
          'auth.login.submit' | transloco
        }}</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <sv-field
            [label]="'auth.newPassword' | transloco"
            for="password"
            [error]="state.fields()['password']"
            [hint]="'auth.passwordHint' | transloco"
          >
            <input
              id="password"
              type="password"
              autocomplete="new-password"
              class="sv-input"
              formControlName="password"
              required
              minlength="10"
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
              (state.busy() ? 'common.wait' : 'auth.reset.submit') | transloco
            }}
          </button>
        </form>
      }
    </sv-auth-layout>
  `,
})
export class ResetPasswordPage {
  private readonly http = inject(HttpClient);
  private readonly token =
    inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  protected readonly state = new FormState();
  protected readonly done = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(10)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const ok = await this.state.run(() =>
      firstValueFrom(
        this.http.post('api/v1/auth/password/reset', {
          token: this.token,
          ...this.form.getRawValue(),
        }),
      ),
    );
    if (ok) this.done.set(true);
  }
}
