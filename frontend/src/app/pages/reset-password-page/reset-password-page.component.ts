/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: reset-password-page.component.ts
 * Description: Completes password reset — POST /auth/reset-password with token from query string
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: false,
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  done    = signal(false);
  error   = signal<string | null>(null);
  token   = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private i18n: I18nService,
  ) {
    this.form = this.fb.group({ password: ['', [Validators.required, Validators.minLength(6)]] });
  }

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  submit(): void {
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    this.error.set(null);

    this.http.post(`${environment.apiUrl}/v1/auth/reset-password`, {
      token:    this.token(),
      password: this.form.value.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigate(['/signin']), 2000);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.i18n.tOr('errors.resetFailed', 'Reset failed'));
      },
    });
  }
}
