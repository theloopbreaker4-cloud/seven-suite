/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Route } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/auth/guards';
import { Shell } from './layout/shell';

export const appRoutes: Route[] = [
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'settings/members',
        canActivate: [permissionGuard],
        data: { permission: 'platform:member:read' },
        loadComponent: () =>
          import('./pages/settings/members').then((m) => m.MembersPage),
      },
      {
        path: 'settings/api-keys',
        canActivate: [permissionGuard],
        data: { permission: 'platform:api_key:read' },
        loadComponent: () =>
          import('./pages/settings/api-keys').then((m) => m.ApiKeysPage),
      },
      {
        path: 'settings/roles',
        canActivate: [permissionGuard],
        data: { permission: 'platform:member:read' },
        loadComponent: () =>
          import('./pages/settings/roles').then((m) => m.RolesPage),
      },
      {
        path: 'settings/organization',
        canActivate: [permissionGuard],
        data: { permission: 'platform:settings:read' },
        loadComponent: () =>
          import('./pages/settings/organization').then((m) => m.OrganizationPage),
      },
      {
        path: 'settings/modules',
        loadComponent: () =>
          import('./pages/settings/modules').then((m) => m.ModulesPage),
      },
      {
        path: 'system/queues',
        loadComponent: () =>
          import('./pages/system/queues').then((m) => m.QueuesPage),
      },
      {
        path: 'settings/security',
        loadComponent: () =>
          import('./pages/settings/security').then((m) => m.SecurityPage),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/signup').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/auth/reset-password').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./pages/auth/verify-email').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'invitation',
    loadComponent: () =>
      import('./pages/auth/invitation').then((m) => m.InvitationPage),
  },
  { path: '**', redirectTo: '' },
];
