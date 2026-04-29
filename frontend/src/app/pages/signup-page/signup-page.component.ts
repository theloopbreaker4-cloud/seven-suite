/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: signup-page.component.ts
 * Description: Public registration page — collects user details and creates account
 * Created: 2026-04-24
 */

import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-signup-page',
  standalone: false,
  templateUrl: './signup-page.component.html',
})
export class SignupPageComponent {
  form: FormGroup;
  loading = signal(false);
  error   = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private i18n: I18nService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.value, undefined, true).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.i18n.tOr('errors.registerFailed', 'Registration failed'));
      },
    });
  }
}
