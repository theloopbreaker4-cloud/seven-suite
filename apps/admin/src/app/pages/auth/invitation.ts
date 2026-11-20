/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthLayout } from '../../layout/auth-layout';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';
import { RoleNamePipe } from '../../ui/role-name.pipe';

interface Preview {
  organization: string;
  email: string;
  role: string;
  hasAccount: boolean;
}

/**
 * Accept an invitation. Existing account: enter its password. New: choose name + password.
 */
@Component({
  selector: 'sv-invitation',
  imports: [
    AuthLayout,
    Field,
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    RoleNamePipe,
  ],
  template: `
    <sv-auth-layout [title]="'auth.invite.title' | transloco">
      @if (preview(); as p) {
        <p class="mb-5 text-sm">
          {{
            'auth.invite.intro'
              | transloco
                : { organization: p.organization, role: (p.role | roleName) }
          }}
          <br /><span class="text-muted">{{ p.email }}</span>
        </p>
        <form [formGroup]="form" (ngSubmit)="submit(p)" novalidate>
          @if (!p.hasAccount) {
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
              />
            </sv-field>
          }
          <sv-field
            [label]="
              (p.hasAccount ? 'auth.password' : 'auth.newPassword') | transloco
            "
            for="password"
            [error]="state.fields()['password']"
            [hint]="
              p.hasAccount
                ? ('auth.invite.existing' | transloco)
                : ('auth.passwordHint' | transloco)
            "
          >
            <input
              id="password"
              type="password"
              class="sv-input"
              formControlName="password"
              [attr.autocomplete]="
                p.hasAccount ? 'current-password' : 'new-password'
              "
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
            [disabled]="state.busy()"
          >
            {{
              (state.busy() ? 'common.wait' : 'auth.invite.submit') | transloco
            }}
          </button>
        </form>
      } @else if (loadError()) {
        <p
          class="mb-4 rounded-md bg-surface-2 px-3 py-3 text-sm text-danger"
          role="alert"
        >
          {{ loadError() }}
        </p>
        <a class="sv-link text-sm" routerLink="/login">{{
          'auth.backToLogin' | transloco
        }}</a>
      } @else {
        <p class="text-sm text-muted">{{ 'common.wait' | transloco }}</p>
      }
    </sv-auth-layout>
  `,
})
export class InvitationPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(AuthStore);
  private readonly token =
    inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  protected readonly state = new FormState();
  private readonly loader = new FormState();
  protected readonly preview = signal<Preview | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [''],
    password: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.loader.run(async () =>
      this.preview.set(
        await firstValueFrom(
          this.http.get<Preview>('/api/v1/auth/invitations/preview', {
            params: { token: this.token },
          }),
        ),
      ),
    );
    this.loadError.set(this.loader.message());
  }

  async submit(p: Preview): Promise<void> {
    const { name, password } = this.form.getRawValue();
    const ok = await this.state.run(() =>
      this.store.acceptInvitation({
        token: this.token,
        password,
        ...(p.hasAccount ? {} : { name }),
      }),
    );
    if (ok) await this.router.navigateByUrl('/');
  }
}
