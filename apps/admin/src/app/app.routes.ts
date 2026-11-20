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
