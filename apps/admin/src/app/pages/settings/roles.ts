/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
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
import { RoleNamePipe } from '../../ui/role-name.pipe';
import { ToastService } from '../../ui/toast';

interface Role {
  key: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
  assignable: boolean;
}

/** Settings → Roles: built-in roles (read-only) and the organization's own roles. */
@Component({
  selector: 'sv-roles',
  imports: [ReactiveFormsModule, TranslocoPipe, Field, CanDirective, RoleNamePipe],
  template: `
    <h1 class="mb-2 text-2xl font-semibold">{{ 'nav.roles' | transloco }}</h1>
    <p class="mb-6 max-w-2xl text-sm text-muted">{{ 'roles.hint' | transloco }}</p>

    @if (editing() !== undefined) {
      <section class="sv-card mb-6 p-5">
        <h2 class="mb-4 font-medium">
          {{ (editing() ? 'roles.edit' : 'roles.new') | transloco }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="grid gap-x-4 md:grid-cols-2">
            <sv-field [label]="'roles.name' | transloco" for="role-name" [error]="state.fields()['name']">
              <input id="role-name" class="sv-input" formControlName="name" maxlength="80" />
            </sv-field>
            <sv-field [label]="'roles.key' | transloco" for="role-key" [error]="state.fields()['key']">
              <input id="role-key" class="sv-input font-mono" formControlName="key" maxlength="40" />
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
          </fieldset>
          @if (state.message()) {
            <p class="mb-4 text-sm text-danger" role="alert">{{ state.message() }}</p>
          }
          <div class="flex gap-2">
            <button type="submit" class="sv-btn-primary" [disabled]="state.busy() || form.invalid">
              {{ 'roles.save' | transloco }}
            </button>
            <button type="button" class="sv-btn-ghost" (click)="editing.set(undefined)">{{ 'roles.cancel' | transloco }}</button>
          </div>
        </form>
      </section>
    } @else {
      <button *svCan="'platform:role:create'" type="button" class="sv-btn-primary mb-6" (click)="startNew()">
        {{ 'roles.new' | transloco }}
      </button>
    }

    <section class="sv-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-border text-muted">
          <tr>
            <th class="px-4 py-2 font-medium">{{ 'roles.name' | transloco }}</th>
            <th class="px-4 py-2 font-medium">{{ 'apiKeys.permissions' | transloco }}</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          @for (r of roles(); track r.key) {
            <tr class="border-b border-border align-top last:border-0">
              <td class="px-4 py-2">
                {{ r.key | roleName: r.name }}
                @if (r.isSystem) {
                  <span class="ml-1 text-xs text-muted">({{ 'roles.builtIn' | transloco }})</span>
                }
              </td>
              <td class="px-4 py-2 font-mono text-xs">{{ r.permissions.join(', ') || '—' }}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right">
                @if (!r.isSystem && r.assignable) {
                  <button *svCan="'platform:role:update'" type="button" class="sv-btn-ghost mr-2 px-2 py-1" (click)="startEdit(r)">
                    {{ 'roles.editShort' | transloco }}
                  </button>
                  <button *svCan="'platform:role:delete'" type="button" class="sv-btn-danger px-2 py-1" (click)="remove(r)">
                    {{ 'roles.delete' | transloco }}
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class RolesPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly store = inject(AuthStore);

  protected readonly roles = signal<Role[]>([]);
  /** undefined: not editing; null: new role; Role: editing it. */
  protected readonly editing = signal<Role | null | undefined>(undefined);
  protected readonly picked = signal(new Set<string>());
  protected readonly state = new FormState();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]{1,39}$/)]],
  });
  protected readonly grantable = computed(() =>
    PERMISSION_CATALOG.map((p) => p.key).filter((k) => hasPermission(this.store.permissions(), k)),
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.roles.set((await firstValueFrom(this.http.get<{ items: Role[] }>('api/v1/org/roles'))).items);
  }

  startNew(): void {
    this.form.reset({ name: '', key: '' });
    this.form.controls.key.enable();
    this.picked.set(new Set());
    this.state.fields.set({});
    this.state.message.set(null);
    this.editing.set(null);
  }

  startEdit(r: Role): void {
    this.form.reset({ name: r.name, key: r.key });
    this.form.controls.key.disable();
    this.picked.set(new Set(r.permissions));
    this.state.fields.set({});
    this.state.message.set(null);
    this.editing.set(r);
  }

  toggle(p: string): void {
    const next = new Set(this.picked());
    if (next.has(p)) next.delete(p);
    else next.add(p);
    this.picked.set(next);
  }

  async save(): Promise<void> {
    const current = this.editing();
    const { name, key } = this.form.getRawValue();
    const permissions = [...this.picked()];
    const ok = await this.state.run(() =>
      firstValueFrom(
        current
          ? this.http.patch(`api/v1/org/roles/${current.key}`, { name, permissions })
          : this.http.post('api/v1/org/roles', { key, name, permissions }),
      ),
    );
    if (!ok) return;
    this.editing.set(undefined);
    this.toast.success(this.t.translate('roles.saved'));
    await this.load();
  }

  async remove(r: Role): Promise<void> {
    if (!confirm(this.t.translate('roles.confirmDelete', { name: r.name }))) return;
    try {
      await firstValueFrom(this.http.delete(`api/v1/org/roles/${r.key}`));
      this.toast.success(this.t.translate('roles.deleted'));
      await this.load();
    } catch (e) {
      const err = apiError(e);
      const key = `errors.${err.code}`;
      const text = this.t.translate(key);
      this.toast.error(text !== key ? text : err.error);
    }
  }
}
