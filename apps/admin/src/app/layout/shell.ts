/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, computed, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../core/auth/auth.store';
import { LANGUAGES, PreferencesService } from '../core/preferences.service';
import { apiError } from '../core/api-error';
import { ToastService } from '../ui/toast';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * The signed-in frame. Menu entries a user has no permission for are hidden; modules add their
 * sections here as they land (CRM in M3, …).
 */
const NAV: NavSection[] = [
  { items: [{ label: 'nav.dashboard', path: '/', icon: '▦' }] },
  {
    label: 'nav.settings',
    items: [
      {
        label: 'nav.members',
        path: '/settings/members',
        icon: '👥',
        permission: 'platform:member:read',
      },
      {
        label: 'nav.apiKeys',
        path: '/settings/api-keys',
        icon: '🔑',
        permission: 'platform:api_key:read',
      },
      { label: 'nav.security', path: '/settings/security', icon: '🛡' },
    ],
  },
];

@Component({
  selector: 'sv-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  template: `
    <div class="flex min-h-full">
      <aside
        class="fixed inset-y-0 left-0 z-30 w-60 -translate-x-full border-r border-border bg-surface transition-transform md:static md:translate-x-0"
        [class.translate-x-0]="menuOpen()"
      >
        <div
          class="flex h-14 items-center gap-2 border-b border-border px-4 font-semibold"
        >
          <span
            class="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-text"
            >7</span
          >
          Seven Suite
        </div>
        <nav class="p-3 text-sm">
          @for (section of nav(); track $index) {
            @if (section.label) {
              <div
                class="mt-4 mb-1 px-2 text-xs font-semibold tracking-wide text-muted uppercase"
              >
                {{ section.label | transloco }}
              </div>
            }
            @for (item of section.items; track item.path) {
              <a
                [routerLink]="item.path"
                (click)="menuOpen.set(false)"
                routerLinkActive="bg-surface-2 text-primary"
                [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                class="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-2"
              >
                <span aria-hidden="true" class="w-5 text-center">{{
                  item.icon
                }}</span>
                {{ item.label | transloco }}
              </a>
            }
          }
        </nav>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex h-14 items-center gap-3 border-b border-border bg-surface px-4"
        >
          <button
            type="button"
            class="sv-btn-ghost px-2 py-1 md:hidden"
            (click)="menuOpen.set(!menuOpen())"
            aria-label="Menu"
          >
            ☰
          </button>

          @if (store.me(); as me) {
            @if (me.organizations.length > 1) {
              <select
                class="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                (change)="switchOrg($any($event.target).value)"
                [attr.aria-label]="'shell.organization' | transloco"
              >
                @for (o of me.organizations; track o.id) {
                  <option
                    [value]="o.slug"
                    [selected]="o.id === me.organization?.id"
                  >
                    {{ o.name }}
                  </option>
                }
              </select>
            } @else {
              <span class="text-sm font-medium">{{
                me.organization?.name
              }}</span>
            }
          }

          <div class="ml-auto flex items-center gap-2 text-sm">
            <select
              class="rounded-md border border-border bg-surface px-2 py-1"
              (change)="prefs.lang.set($any($event.target).value)"
              [attr.aria-label]="'common.language' | transloco"
            >
              @for (l of languages; track l.code) {
                <option [value]="l.code" [selected]="l.code === prefs.lang()">
                  {{ l.label }}
                </option>
              }
            </select>
            <button
              type="button"
              class="sv-btn-ghost px-2 py-1"
              (click)="prefs.toggleTheme()"
              [attr.aria-label]="
                (prefs.theme() === 'dark'
                  ? 'common.lightTheme'
                  : 'common.darkTheme'
                ) | transloco
              "
            >
              {{ prefs.theme() === 'dark' ? '☀' : '☾' }}
            </button>
            <span class="hidden text-muted sm:inline">{{
              store.me()?.user?.name
            }}</span>
            <button
              type="button"
              class="sv-btn-ghost px-3 py-1"
              (click)="logout()"
            >
              {{ 'shell.logout' | transloco }}
            </button>
          </div>
        </header>

        <main class="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  protected readonly store = inject(AuthStore);
  protected readonly prefs = inject(PreferencesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly languages = LANGUAGES;
  protected readonly menuOpen = signal(false);

  protected readonly nav = computed(() => {
    this.store.permissions(); // recompute when permissions change (org switch)
    return NAV.map((s) => ({
      ...s,
      items: s.items.filter(
        (i) => !i.permission || this.store.can(i.permission),
      ),
    })).filter((s) => s.items.length > 0);
  });

  async switchOrg(slug: string): Promise<void> {
    try {
      await this.store.switchOrganization(slug);
      await this.router.navigateByUrl('/');
    } catch (e) {
      this.toast.error(apiError(e).error);
    }
  }

  async logout(): Promise<void> {
    await this.store.logout();
    await this.router.navigateByUrl('/login');
  }
}
