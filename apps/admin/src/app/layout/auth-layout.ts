/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LANGUAGES,
  PreferencesService,
  type Lang,
} from '../core/preferences.service';

/** Centered card used by every signed-out page. */
@Component({
  selector: 'sv-auth-layout',
  imports: [TranslocoPipe],
  template: `
    <div
      class="flex min-h-full flex-col items-center justify-center px-4 py-10"
    >
      <div class="mb-6 flex items-center gap-2 text-lg font-semibold">
        <span
          class="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-text"
          >7</span
        >
        Seven Suite
      </div>
      <div class="sv-card w-full max-w-md p-6 shadow-sm">
        <h1 class="mb-1 text-xl font-semibold">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mb-5 text-sm text-muted">{{ subtitle() }}</p>
        } @else {
          <div class="mb-5"></div>
        }
        <ng-content />
      </div>
      <div class="mt-6 flex items-center gap-3 text-sm text-muted">
        <select
          class="rounded border border-border bg-surface px-2 py-1"
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
          class="hover:text-text"
          (click)="prefs.toggleTheme()"
        >
          {{
            (prefs.theme() === 'dark'
              ? 'common.lightTheme'
              : 'common.darkTheme'
            ) | transloco
          }}
        </button>
      </div>
    </div>
  `,
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  protected readonly prefs = inject(PreferencesService);
  protected readonly languages = LANGUAGES;
  protected setLang(lang: Lang): void {
    this.prefs.lang.set(lang);
  }
}
