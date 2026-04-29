/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: profile-page.component.ts
 * Description: User profile editor — name, email, avatar (view/update current user)
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-profile-page',
  standalone: false,
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  loading = signal(false);
  saved   = signal(false);

  constructor(public auth: AuthService, private i18n: I18nService) {}

  ngOnInit(): void {}

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }
}
