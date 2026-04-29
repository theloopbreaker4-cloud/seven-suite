/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: signin-page.component.ts
 * Description: Public sign-in page — email + password form posting to /auth/login
 * Created: 2026-04-24
 */

import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-signin-page',
  standalone: false,
  templateUrl: './signin-page.component.html',
})
export class SigninPageComponent {
  form: FormGroup;
  loading = signal(false);
  error   = signal<string | null>(null);
  showPwd = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private i18n: I18nService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { email, password, rememberMe } = this.form.value;
    this.auth.login(email, password, undefined, rememberMe).subscribe({
      next: res => {
        this.loading.set(false);
        if (res?.requires2FA) {
          this.router.navigate(['/verify-2fa'], { queryParams: { email } });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.i18n.tOr('errors.loginFailed', 'Login failed'));
      },
    });
  }
}
