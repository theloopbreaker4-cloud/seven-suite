/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: oauth-config.service.ts
 * Description: Service for getting available OAuth providers
 * Created: 2025-11-02
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface OAuthProviders {
  google: boolean;
  facebook: boolean;
  github: boolean;
  discord: boolean;
  telegram: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OAuthConfigService {
  private readonly API_URL = `${environment.apiUrl}/${environment.apiVersion}`;
  private providers$: Observable<OAuthProviders> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get available OAuth providers (cached)
   */
  getAvailableProviders(): Observable<OAuthProviders> {
    if (!this.providers$) {
      this.providers$ = this.http.get<OAuthProviders>(`${this.API_URL}/auth/config/providers`).pipe(
        catchError(() => of({ google: false, facebook: false, github: false, discord: false, telegram: false })),
        shareReplay(1)
      );
    }
    return this.providers$;
  }

  /**
   * Get OAuth login URL
   */
  getOAuthUrl(provider: 'google' | 'facebook' | 'github' | 'discord' | 'telegram'): string {
    return `${this.API_URL}/auth/${provider}`;
  }
}
