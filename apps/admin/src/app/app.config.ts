/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthStore } from './core/auth/auth.store';
import { HttpTranslationLoader } from './core/i18n';
import { LANGUAGES } from './core/preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: LANGUAGES.map((l) => l.code),
        defaultLang: 'en',
        fallbackLang: 'en',
        missingHandler: {
          useFallbackTranslation: true,
          logMissingKey: isDevMode(),
        },
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: HttpTranslationLoader,
    }),
    // Resume the session from the refresh cookie before the first route resolves.
    provideAppInitializer(() => inject(AuthStore).restore()),
  ],
};
