/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: verify-email-page.component.ts
 * Description: Handles email verification link — posts token to backend and shows result
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: false,
  templateUrl: './verify-email-page.component.html',
})
export class VerifyEmailPageComponent implements OnInit {
  state = signal<'pending' | 'ok' | 'fail'>('pending');
  message = signal<string>('');

  constructor(private route: ActivatedRoute, private http: HttpClient, private i18n: I18nService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('fail');
      this.message.set(this.i18n.tOr('errors.missingToken', 'Missing token'));
      return;
    }

    this.http.post(`${environment.apiUrl}/v1/auth/verify-email`, { token }).subscribe({
      next: () => {
        this.state.set('ok');
        this.message.set(this.i18n.tOr('verify.ok', 'Email verified successfully'));
      },
      error: err => {
        this.state.set('fail');
        this.message.set(err?.error?.message || this.i18n.tOr('verify.fail', 'Verification failed'));
      },
    });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }
}
