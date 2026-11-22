/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { Field } from '../../ui/field';
import { FormState } from '../../ui/form-state';
import { ToastService } from '../../ui/toast';

interface Settings {
  name: string;
  legalName: string | null;
  country: string;
  baseCurrency: string;
  timezone: string;
  locale: string;
  languages: string[];
  supportedLanguages: string[];
}

/** Language names in their own language — recognisable whatever the UI language is. */
const LANGUAGE_NAMES: Record<string, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  az: 'Azərbaycanca',
  hy: 'Հայերեն',
};

/** Settings → Organization: the company profile every module reads (currency, time zone, languages). */
@Component({
  selector: 'sv-organization',
  imports: [ReactiveFormsModule, TranslocoPipe, Field],
  template: `
    <h1 class="mb-6 text-2xl font-semibold">{{ 'nav.organization' | transloco }}</h1>
    @if (loaded()) {
      <form class="sv-card max-w-2xl p-5" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="grid gap-x-4 md:grid-cols-2">
          <sv-field [label]="'org.name' | transloco" for="org-name" [error]="state.fields()['name']">
            <input id="org-name" class="sv-input" formControlName="name" maxlength="120" />
          </sv-field>
          <sv-field [label]="'org.legalName' | transloco" for="org-legal" [error]="state.fields()['legalName']">
            <input id="org-legal" class="sv-input" formControlName="legalName" maxlength="200" />
          </sv-field>
          <sv-field [label]="'org.country' | transloco" for="org-country" [error]="state.fields()['country']">
            <input id="org-country" class="sv-input uppercase" formControlName="country" maxlength="2" />
          </sv-field>
          <sv-field [label]="'org.currency' | transloco" for="org-currency" [error]="state.fields()['baseCurrency']">
            <input id="org-currency" class="sv-input uppercase" formControlName="baseCurrency" maxlength="3" />
          </sv-field>
          <sv-field [label]="'org.timezone' | transloco" for="org-tz" [error]="state.fields()['timezone']">
            <select id="org-tz" class="sv-input" formControlName="timezone">
              @for (tz of timezones; track tz) {
                <option [value]="tz">{{ tz }}</option>
              }
            </select>
          </sv-field>
          <sv-field [label]="'org.defaultLanguage' | transloco" for="org-locale" [error]="state.fields()['locale']">
            <select id="org-locale" class="sv-input" formControlName="locale">
              @for (l of enabled(); track l) {
                <option [value]="l">{{ names[l] ?? l }}</option>
              }
            </select>
          </sv-field>
        </div>
        <fieldset class="mb-4">
          <legend class="sv-label mb-2">{{ 'org.languages' | transloco }}</legend>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            @for (l of supported(); track l) {
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [checked]="enabled().includes(l)" [disabled]="!canEdit || l === form.controls.locale.value" (change)="toggle(l)" />
                {{ names[l] ?? l }}
              </label>
            }
          </div>
          @if (state.fields()['languages']) {
            <p class="mt-1 text-sm text-danger">{{ state.fields()['languages'] }}</p>
          }
        </fieldset>
        @if (state.message()) {
          <p class="mb-4 text-sm text-danger" role="alert">{{ state.message() }}</p>
        }
        @if (canEdit) {
          <button type="submit" class="sv-btn-primary" [disabled]="state.busy() || form.invalid || form.pristine">
            {{ (state.busy() ? 'common.wait' : 'org.save') | transloco }}
          </button>
        }
      </form>
    }
  `,
})
export class OrganizationPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly store = inject(AuthStore);

  protected readonly names = LANGUAGE_NAMES;
  protected readonly timezones: string[] = (
    Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
  ).supportedValuesOf?.('timeZone') ?? ['Asia/Tbilisi', 'Europe/Kyiv', 'Asia/Baku', 'Asia/Yerevan', 'UTC'];
  protected readonly canEdit = this.store.can('platform:settings:update');
  protected readonly loaded = signal(false);
  protected readonly supported = signal<string[]>([]);
  protected readonly enabled = signal<string[]>([]);
  protected readonly state = new FormState();
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    legalName: [''],
    country: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    baseCurrency: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
    timezone: ['', Validators.required],
    locale: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    const s = await firstValueFrom(this.http.get<Settings>('api/v1/org/settings'));
    this.supported.set(s.supportedLanguages);
    this.apply(s);
    if (!this.canEdit) this.form.disable();
    this.loaded.set(true);
  }

  private apply(s: Settings): void {
    if (!this.timezones.includes(s.timezone)) this.timezones.unshift(s.timezone);
    this.enabled.set(s.languages);
    this.form.reset({
      name: s.name,
      legalName: s.legalName ?? '',
      country: s.country,
      baseCurrency: s.baseCurrency,
      timezone: s.timezone,
      locale: s.locale,
    });
  }

  toggle(lang: string): void {
    const now = this.enabled();
    this.enabled.set(now.includes(lang) ? now.filter((l) => l !== lang) : [...now, lang]);
    this.form.markAsDirty();
  }

  async save(): Promise<void> {
    const v = this.form.getRawValue();
    let saved: Settings | null = null;
    const ok = await this.state.run(async () => {
      saved = await firstValueFrom(
        this.http.patch<Settings>('api/v1/org/settings', {
          ...v,
          legalName: v.legalName.trim() || null,
          country: v.country.toUpperCase(),
          baseCurrency: v.baseCurrency.toUpperCase(),
          languages: this.enabled(),
        }),
      );
    });
    if (!ok || !saved) return;
    this.apply({ ...(saved as Settings), supportedLanguages: this.supported() });
    await this.store.loadMe(); // the organization name in the top bar
    this.toast.success(this.t.translate('org.saved'));
  }
}
