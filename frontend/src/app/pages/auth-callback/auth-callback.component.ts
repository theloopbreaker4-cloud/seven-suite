/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth-callback.component.ts
 * Description: OAuth callback — reads access_token from query string, stores it, then redirects home
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private i18n: I18nService,
  ) {}

  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.error.set(this.i18n.tOr('errors.missingToken', 'Missing token')); return; }

    localStorage.setItem('access_token', token);
    this.auth.refreshUser();
    this.router.navigate(['/dashboard']);
  }
}
