/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import { CanDirective } from '../../core/auth/can.directive';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';
import { RoleNamePipe } from '../../ui/role-name.pipe';
import { ToastService } from '../../ui/toast';

interface Member {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  role: { key: string; name: string };
  isYou: boolean;
}
interface Role {
  key: string;
  name: string;
  assignable: boolean;
}
interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

@Component({
  selector: 'sv-members',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    DatePipe,
    Field,
    CanDirective,
    RoleNamePipe,
  ],
  template: `
    <h1 class="mb-6 text-2xl font-semibold">{{ 'nav.members' | transloco }}</h1>

    <section *svCan="'platform:member:invite'" class="sv-card mb-6 p-5">
      <h2 class="mb-4 font-medium">{{ 'members.invite' | transloco }}</h2>
      <form
        class="grid gap-x-4 md:grid-cols-[1fr_12rem_auto] md:items-start"
        [formGroup]="inviteForm"
        (ngSubmit)="invite()"
        novalidate
      >
        <sv-field
          [label]="'auth.email' | transloco"
          for="invite-email"
          [error]="inviteState.fields()['email']"
        >
          <input
            id="invite-email"
            type="email"
            class="sv-input"
            formControlName="email"
          />
        </sv-field>
        <sv-field
          [label]="'members.role' | transloco"
          for="invite-role"
          [error]="inviteState.fields()['role']"
        >
          <select id="invite-role" class="sv-input" formControlName="role">
            @for (r of assignableRoles(); track r.key) {
              <option [value]="r.key">{{ r.key | roleName: r.name }}</option>
            }
          </select>
        </sv-field>
        <button
          type="submit"
          class="sv-btn-primary md:mt-6"
          [disabled]="inviteState.busy() || inviteForm.invalid"
        >
          {{ 'members.send' | transloco }}
        </button>
      </form>
      @if (inviteState.message()) {
        <p class="text-sm text-danger" role="alert">
          {{ inviteState.message() }}
        </p>
      }
    </section>

    <section class="sv-card mb-6 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-border text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">
              {{ 'members.name' | transloco }}
            </th>
            <th class="px-4 py-3 font-medium">
              {{ 'auth.email' | transloco }}
            </th>
            <th class="px-4 py-3 font-medium">
              {{ 'members.role' | transloco }}
            </th>
            <th class="px-4 py-3 font-medium">
              {{ 'members.lastLogin' | transloco }}
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          @for (m of members(); track m.id) {
            <tr class="border-b border-border last:border-0">
              <td class="px-4 py-3">
                {{ m.name }}
                @if (m.isYou) {
                  <span class="ml-1 text-xs text-muted"
                    >({{ 'members.you' | transloco }})</span
                  >
                }
              </td>
              <td class="px-4 py-3">
                {{ m.email }}
                @if (!m.emailVerified) {
                  <span class="ml-1 text-xs text-warning">{{
                    'members.unverified' | transloco
                  }}</span>
                }
              </td>
              <td class="px-4 py-3">
                @if (canManage(m)) {
                  <select
                    class="rounded border border-border bg-surface px-2 py-1"
                    (change)="changeRole(m, $any($event.target).value)"
                  >
                    @for (r of assignableRoles(); track r.key) {
                      <option [value]="r.key" [selected]="r.key === m.role.key">
                        {{ r.key | roleName: r.name }}
                      </option>
                    }
                  </select>
                } @else {
                  {{ m.role.key | roleName: m.role.name }}
                }
              </td>
              <td class="px-4 py-3 text-muted">
                {{ m.lastLoginAt ? (m.lastLoginAt | date: 'short') : '—' }}
              </td>
              <td class="px-4 py-3 text-right">
                @if (canRemove(m)) {
                  <button
                    type="button"
                    class="sv-btn-danger px-2 py-1"
                    (click)="remove(m)"
                  >
                    {{ 'common.remove' | transloco }}
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    @if (invitations().length) {
      <section class="sv-card overflow-x-auto">
        <h2 class="border-b border-border px-4 py-3 font-medium">
          {{ 'members.pending' | transloco }}
        </h2>
        <table class="w-full text-left text-sm">
          <tbody>
            @for (i of invitations(); track i.id) {
              <tr class="border-b border-border last:border-0">
                <td class="px-4 py-3">{{ i.email }}</td>
                <td class="px-4 py-3">{{ i.role | roleName }}</td>
                <td class="px-4 py-3 text-muted">
                  {{ 'members.expires' | transloco }}
                  {{ i.expiresAt | date: 'mediumDate' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    *svCan="'platform:member:invite'"
                    type="button"
                    class="sv-btn-danger px-2 py-1"
                    (click)="revoke(i)"
                  >
                    {{ 'members.revoke' | transloco }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class MembersPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly members = signal<Member[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly invitations = signal<Invitation[]>([]);
  protected readonly assignableRoles = computed(() =>
    this.roles().filter((r) => r.assignable),
  );
  protected readonly inviteState = new FormState();
  protected readonly inviteForm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected canManage(m: Member): boolean {
    const role = this.roles().find((r) => r.key === m.role.key);
    return (
      !m.isYou && this.store.can('platform:member:update') && !!role?.assignable
    );
  }

  protected canRemove(m: Member): boolean {
    const role = this.roles().find((r) => r.key === m.role.key);
    return (
      !m.isYou && this.store.can('platform:member:remove') && !!role?.assignable
    );
  }

  async invite(): Promise<void> {
    if (this.inviteForm.invalid) return;
    const ok = await this.inviteState.run(() =>
      firstValueFrom(
        this.http.post(
          '/api/v1/org/invitations',
          this.inviteForm.getRawValue(),
        ),
      ),
    );
    if (ok) {
      this.toast.success(
        this.t.translate('members.sent', {
          email: this.inviteForm.getRawValue().email,
        }),
      );
      this.inviteForm.reset({ email: '', role: 'member' });
      await this.reload();
    }
  }

  async changeRole(m: Member, role: string): Promise<void> {
    await this.act(
      () =>
        firstValueFrom(
          this.http.patch(`/api/v1/org/members/${m.id}`, { role }),
        ),
      'members.roleChanged',
    );
  }

  async remove(m: Member): Promise<void> {
    if (!confirm(this.t.translate('members.confirmRemove', { name: m.name })))
      return;
    await this.act(
      () => firstValueFrom(this.http.delete(`/api/v1/org/members/${m.id}`)),
      'members.removed',
    );
  }

  async revoke(i: Invitation): Promise<void> {
    await this.act(
      () => firstValueFrom(this.http.delete(`/api/v1/org/invitations/${i.id}`)),
      'members.revoked',
    );
  }

  private async act(
    action: () => Promise<unknown>,
    successKey: string,
  ): Promise<void> {
    try {
      await action();
      this.toast.success(this.t.translate(successKey));
    } catch (e) {
      this.toast.error(apiError(e).error);
    }
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      const [members, roles, invitations] = await Promise.all([
        firstValueFrom(
          this.http.get<{ items: Member[] }>('/api/v1/org/members'),
        ),
        firstValueFrom(this.http.get<{ items: Role[] }>('/api/v1/org/roles')),
        this.store.can('platform:member:read')
          ? firstValueFrom(
              this.http.get<{ items: Invitation[] }>('/api/v1/org/invitations'),
            )
          : Promise.resolve({ items: [] }),
      ]);
      this.members.set(members.items);
      this.roles.set(roles.items);
      this.invitations.set(invitations.items);
    } catch (e) {
      this.toast.error(apiError(e).error);
    }
  }
}
