/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app-routing.module.ts
 * Description: Application routing — public site, user area (auth-guarded), lazy-loaded admin
 * Created: 2025-10-26
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainPageComponent }           from './pages/main-page/main-page.component';
import { SigninPageComponent }         from './pages/signin-page/signin-page.component';
import { SignupPageComponent }         from './pages/signup-page/signup-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { ResetPasswordPageComponent }  from './pages/reset-password-page/reset-password-page.component';
import { VerifyEmailPageComponent }    from './pages/verify-email-page/verify-email-page.component';
import { AuthCallbackComponent }       from './pages/auth-callback/auth-callback.component';
import { DashboardPageComponent }      from './pages/dashboard-page/dashboard-page.component';
import { ProfilePageComponent }        from './pages/profile-page/profile-page.component';
import { SettingsPageComponent }       from './pages/settings-page/settings-page.component';
import { FaqPageComponent }            from './pages/faq-page/faq-page.component';
import { SupportPageComponent }        from './pages/support-page/support-page.component';
import { BlogPageComponent }           from './pages/blog-page/blog-page.component';
import { BlogPostPageComponent }       from './pages/blog-post-page/blog-post-page.component';
import { ContentPageComponent }        from './pages/content-page/content-page.component';
import { Error404PageComponent }       from './pages/error404-page/error404-page.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '',                component: MainPageComponent },
  { path: 'blog',            component: BlogPageComponent },
  { path: 'blog/:slug',      component: BlogPostPageComponent },
  { path: 'p/:slug',         component: ContentPageComponent },
  { path: 'faq',             component: FaqPageComponent },
  { path: 'support',         component: SupportPageComponent },

  { path: 'signin',          component: SigninPageComponent },
  { path: 'signup',          component: SignupPageComponent },
  { path: 'forgot-password', component: ForgotPasswordPageComponent },
  { path: 'reset-password',  component: ResetPasswordPageComponent },
  { path: 'verify-email',    component: VerifyEmailPageComponent },
  { path: 'auth/callback',   component: AuthCallbackComponent },

  { path: 'login',           redirectTo: 'signin', pathMatch: 'full' },
  { path: 'register',        redirectTo: 'signup', pathMatch: 'full' },

  { path: 'dashboard',       component: DashboardPageComponent, canActivate: [AuthGuard] },
  { path: 'account',         redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'account/profile', component: ProfilePageComponent,  canActivate: [AuthGuard] },
  { path: 'account/settings', component: SettingsPageComponent, canActivate: [AuthGuard] },

  { path: 'admin',           loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },

  { path: '**', pathMatch: 'full', component: Error404PageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
