/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { hasPermission } from '@seven/shared';
import { firstValueFrom } from 'rxjs';

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  organizationId: string;
  role: string;
  permissions: string[];
}

export interface OrganizationRef {
  id: string;
  slug: string;
  name: string;
  role?: { key: string; name: string };
}

export interface Me {
  user: {
    id: string;
    email: string;
    name: string;
    locale: string;
    emailVerified: string | null;
    lastLoginAt: string | null;
  };
  organization: OrganizationRef | null;
  role: string;
  permissions: string[];
  organizations: OrganizationRef[];
}

/**
 * The signed-in session. The access token lives only in memory (a signal); the refresh token
 * is an httpOnly cookie the browser sends to /api/v1/auth — JavaScript never sees it.
 * A page reload restores the session by calling refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private refreshing: Promise<boolean> | null = null;

  readonly accessToken = signal<string | null>(null);
  readonly me = signal<Me | null>(null);
  readonly isSignedIn = computed(() => this.me() !== null);
  readonly permissions = computed(() => this.me()?.permissions ?? []);

  can(permission: string): boolean {
    return hasPermission(this.permissions(), permission);
  }

  /** Called once at startup: resume a session from the refresh cookie, if any. */
  async restore(): Promise<void> {
    if (await this.refresh()) await this.loadMe().catch(() => this.clear());
  }

  async login(body: {
    email: string;
    password: string;
    organization?: string;
  }): Promise<void> {
    await this.start(
      this.http.post<SessionResponse>('api/v1/auth/login', body),
    );
  }

  async signup(body: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }): Promise<void> {
    await this.start(
      this.http.post<SessionResponse>('api/v1/auth/signup', body),
    );
  }

  async acceptInvitation(body: {
    token: string;
    name?: string;
    password?: string;
  }): Promise<void> {
    await this.start(
      this.http.post<SessionResponse>('api/v1/auth/invitations/accept', body),
    );
  }

  async switchOrganization(slug: string): Promise<void> {
    await this.start(
      this.http.post<SessionResponse>('api/v1/auth/switch-organization', {
        organization: slug,
      }),
    );
  }

  /**
   * Exchange the refresh cookie for a new access token. Concurrent callers share one request —
   * the server rotates the refresh token, so two parallel refreshes would look like a replay.
   */
  refresh(): Promise<boolean> {
    this.refreshing ??= firstValueFrom(
      this.http.post<SessionResponse>('api/v1/auth/refresh', {}),
    )
      .then((s) => {
        this.accessToken.set(s.accessToken);
        return true;
      })
      .catch(() => {
        this.clear();
        return false;
      })
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('api/v1/auth/logout', {})).catch(
      () => undefined,
    );
    this.clear();
  }

  async loadMe(): Promise<void> {
    this.me.set(await firstValueFrom(this.http.get<Me>('api/v1/auth/me')));
  }

  clear(): void {
    this.accessToken.set(null);
    this.me.set(null);
  }

  private async start(request: ReturnType<HttpClient['post']>): Promise<void> {
    const session = (await firstValueFrom(request)) as SessionResponse;
    this.accessToken.set(session.accessToken);
    await this.loadMe();
  }
}
