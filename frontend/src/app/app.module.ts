/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app.module.ts
 * Description: Root application module — clean Tailwind-first setup with HTTP interceptors
 * Created: 2025-10-26
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NgxCaptchaModule } from 'ngx-captcha';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SiteLayoutComponent } from './components/site-layout/site-layout.component';

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

import {
  AuthInterceptor,
  ErrorInterceptor,
  LoggingInterceptor,
  CacheInterceptor,
  LoadingInterceptor,
} from './interceptors';

@NgModule({
  declarations: [
    AppComponent,
    SiteLayoutComponent,
    MainPageComponent,
    SigninPageComponent,
    SignupPageComponent,
    ForgotPasswordPageComponent,
    ResetPasswordPageComponent,
    VerifyEmailPageComponent,
    AuthCallbackComponent,
    DashboardPageComponent,
    ProfilePageComponent,
    SettingsPageComponent,
    FaqPageComponent,
    SupportPageComponent,
    BlogPageComponent,
    BlogPostPageComponent,
    ContentPageComponent,
    Error404PageComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    NgxCaptchaModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,    multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor,   multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor,   multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
