/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../core/auth/auth.store';
import { CanDirective } from '../core/auth/can.directive';
import { FormState } from '../ui/form-state';
import { RoleNamePipe } from '../ui/role-name.pipe';
import { ToastService } from '../ui/toast';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'sv-dashboard',
  imports: [RouterLink, TranslocoPipe, CanDirective, RoleNamePipe],
  template: `
    @if (store.me(); as me) {
      @if (!me.user.emailVerified) {
        <div
          class="sv-card mb-6 flex flex-wrap items-center gap-3 border-warning px-4 py-3 text-sm"
        >
          <span class="flex-1">{{
            'dashboard.verifyBanner' | transloco: { email: me.user.email }
          }}</span>
          <button
            type="button"
            class="sv-btn-ghost px-3 py-1"
            [disabled]="resend.busy()"
            (click)="resendVerification()"
          >
            {{ 'dashboard.resend' | transloco }}
          </button>
        </div>
      }
      <h1 class="mb-1 text-2xl font-semibold">
        {{ 'dashboard.hello' | transloco: { name: me.user.name } }}
      </h1>
      <p class="mb-8 text-muted">
        {{ me.organization?.name }} · {{ me.role | roleName }}
      </p>

      <div class="grid gap-4 md:grid-cols-3">
        <a
          *svCan="'platform:member:read'"
          routerLink="/settings/members"
          class="sv-card block p-5 hover:border-primary"
        >
          <div class="mb-1 font-medium">{{ 'nav.members' | transloco }}</div>
          <p class="text-sm text-muted">
            {{ 'dashboard.membersHint' | transloco }}
          </p>
        </a>
        <div class="sv-card p-5 opacity-70">
          <div class="mb-1 font-medium">CRM</div>
          <p class="text-sm text-muted">
            {{ 'dashboard.comingSoon' | transloco }}
          </p>
        </div>
        <div class="sv-card p-5 opacity-70">
          <div class="mb-1 font-medium">{{ 'dashboard.shop' | transloco }}</div>
          <p class="text-sm text-muted">
            {{ 'dashboard.comingSoon' | transloco }}
          </p>
        </div>
      </div>
    }
  `,
})
export class DashboardPage {
  protected readonly store = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  protected readonly resend = new FormState();

  async resendVerification(): Promise<void> {
    const ok = await this.resend.run(() =>
      firstValueFrom(this.http.post('api/v1/auth/verify-email/request', {})),
    );
    if (ok) this.toast.success(this.t.translate('dashboard.resent'));
    else this.toast.error(this.resend.message() ?? '');
  }
}
