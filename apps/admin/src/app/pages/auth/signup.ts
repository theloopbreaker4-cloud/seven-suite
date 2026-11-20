/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthLayout } from '../../layout/auth-layout';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';

@Component({
  selector: 'sv-signup',
  imports: [AuthLayout, Field, ReactiveFormsModule, RouterLink, TranslocoPipe],
  template: `
    <sv-auth-layout
      [title]="'auth.signup.title' | transloco"
      [subtitle]="'auth.signup.subtitle' | transloco"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <sv-field
          [label]="'auth.name' | transloco"
          for="name"
          [error]="state.fields()['name']"
        >
          <input
            id="name"
            autocomplete="name"
            class="sv-input"
            formControlName="name"
            required
          />
        </sv-field>
        <sv-field
          [label]="'auth.organization' | transloco"
          for="org"
          [error]="state.fields()['organizationName']"
        >
          <input
            id="org"
            autocomplete="organization"
            class="sv-input"
            formControlName="organizationName"
            required
          />
        </sv-field>
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
        <sv-field
          [label]="'auth.password' | transloco"
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
            (state.busy() ? 'common.wait' : 'auth.signup.submit') | transloco
          }}
        </button>
      </form>
      <p class="mt-5 text-center text-sm text-muted">
        {{ 'auth.signup.haveAccount' | transloco }}
        <a class="sv-link" routerLink="/login">{{
          'auth.login.link' | transloco
        }}</a>
      </p>
    </sv-auth-layout>
  `,
})
export class SignupPage {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly state = new FormState();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    organizationName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(10)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    if (
      await this.state.run(() => this.store.signup(this.form.getRawValue()))
    ) {
      await this.router.navigateByUrl('/');
    }
  }
}
