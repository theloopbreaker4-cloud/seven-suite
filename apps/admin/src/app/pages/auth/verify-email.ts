/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthLayout } from '../../layout/auth-layout';
import { FormState } from '../../ui/form-state';

/** Opened from the email link; confirms the address immediately. */
@Component({
  selector: 'sv-verify-email',
  imports: [AuthLayout, RouterLink, TranslocoPipe],
  template: `
    <sv-auth-layout [title]="'auth.verify.title' | transloco">
      @if (state.busy()) {
        <p class="text-sm text-muted">{{ 'common.wait' | transloco }}</p>
      } @else if (done()) {
        <p class="mb-4 rounded-md bg-surface-2 px-3 py-3 text-sm">
          {{ 'auth.verify.done' | transloco }}
        </p>
        <a
          class="sv-btn-primary w-full"
          [routerLink]="store.isSignedIn() ? '/' : '/login'"
          >{{ 'common.continue' | transloco }}</a
        >
      } @else {
        <p
          class="mb-4 rounded-md bg-surface-2 px-3 py-3 text-sm text-danger"
          role="alert"
        >
          {{ state.message() }}
        </p>
        <a class="sv-link text-sm" routerLink="/">{{
          'common.continue' | transloco
        }}</a>
      }
    </sv-auth-layout>
  `,
})
export class VerifyEmailPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly token =
    inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  protected readonly store = inject(AuthStore);
  protected readonly state = new FormState();
  protected readonly done = signal(false);

  async ngOnInit(): Promise<void> {
    const ok = await this.state.run(() =>
      firstValueFrom(
        this.http.post('/api/v1/auth/verify-email', { token: this.token }),
      ),
    );
    this.done.set(ok);
    if (ok && this.store.isSignedIn()) await this.store.loadMe();
  }
}
