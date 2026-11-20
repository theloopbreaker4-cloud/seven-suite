/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthStore, type Me } from './auth.store';
import { CanDirective } from './can.directive';
import { safeNext } from './guards';

/** Let promise chains (refresh → replay) run to completion. */
const settle = () => new Promise((r) => setTimeout(r));

const me = (permissions: string[]): Me => ({
  user: {
    id: 'u',
    email: 'a@b.c',
    name: 'A',
    locale: 'en',
    emailVerified: null,
    lastLoginAt: null,
  },
  organization: { id: 'o', slug: 'o', name: 'O' },
  role: 'member',
  permissions,
  organizations: [],
});

describe('admin auth', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
  });
  afterEach(() => backend.verify());

  it('sends the token, cookies and the CSRF header to the API', () => {
    store.accessToken.set('tok-1');
    void firstValueFrom(http.get('/api/v1/org/members'));
    const req = backend.expectOne('/api/v1/org/members');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    expect(req.request.headers.get('X-Requested-With')).toBe('seven-admin');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ items: [] });
  });

  it('leaves non-API requests alone', () => {
    store.accessToken.set('tok-1');
    void firstValueFrom(http.get('/i18n/en.json'));
    const req = backend.expectOne('/i18n/en.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('on 401 refreshes once and replays the request with the new token', async () => {
    store.accessToken.set('expired');
    const result = firstValueFrom(
      http.get<{ ok: boolean }>('/api/v1/org/members'),
    );

    backend
      .expectOne('/api/v1/org/members')
      .flush(
        { error: 'x', code: 'unauthorized' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await settle();
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({
        accessToken: 'fresh',
        expiresIn: 900,
        organizationId: 'o',
        role: 'member',
        permissions: [],
      });
    await settle();
    const retry = backend.expectOne('/api/v1/org/members');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh');
    retry.flush({ ok: true });

    await expect(result).resolves.toEqual({ ok: true });
  });

  it('does not retry a failed login (wrong password is not an expired session)', async () => {
    const result = firstValueFrom(http.post('/api/v1/auth/login', {}));
    backend
      .expectOne('/api/v1/auth/login')
      .flush(
        { error: 'x', code: 'invalid_credentials' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await expect(result).rejects.toBeTruthy();
    backend.expectNone('/api/v1/auth/refresh');
  });

  it('sends to /login when the refresh fails', async () => {
    const navigate = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    const result = firstValueFrom(http.get('/api/v1/org/members'));
    backend
      .expectOne('/api/v1/org/members')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await settle();
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await expect(result).rejects.toBeTruthy();
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
    expect(store.isSignedIn()).toBe(false);
  });

  it('shares one refresh between concurrent callers (the server rotates the token)', async () => {
    const a = store.refresh();
    const b = store.refresh();
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({
        accessToken: 'n',
        expiresIn: 900,
        organizationId: 'o',
        role: 'r',
        permissions: [],
      });
    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
    expect(store.accessToken()).toBe('n');
  });

  it('checks permissions with wildcards', () => {
    store.me.set(me(['crm:*', 'platform:member:read']));
    expect(store.can('crm:deal:write')).toBe(true);
    expect(store.can('platform:member:read')).toBe(true);
    expect(store.can('platform:member:invite')).toBe(false);
  });
});

describe('*svCan', () => {
  @Component({
    imports: [CanDirective],
    template: `<button *svCan="'platform:member:invite'">Invite</button>`,
  })
  class Host {}

  it('renders only with the permission, and reacts to changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const store = TestBed.inject(AuthStore);
    store.me.set(me(['platform:member:read']));
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    store.me.set(me(['platform:member:*']));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button')?.textContent).toBe(
      'Invite',
    );
  });
});

describe('safeNext', () => {
  it('only follows paths inside the app', () => {
    expect(safeNext('/settings/members')).toBe('/settings/members');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('/\\evil.example')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});
