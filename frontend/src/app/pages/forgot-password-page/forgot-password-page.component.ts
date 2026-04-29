/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: forgot-password-page.component.ts
 * Description: Password recovery — POST /auth/forgot-password with user email
 * Created: 2026-04-24
 */

import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: false,
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  form: FormGroup;
  loading = signal(false);
  sent    = signal(false);
  error   = signal<string | null>(null);

  constructor(private fb: FormBuilder, private http: HttpClient, private i18n: I18nService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.http.post(`${environment.apiUrl}/v1/auth/forgot-password`, this.form.value).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.i18n.tOr('errors.requestFailed', 'Request failed'));
      },
    });
  }
}
