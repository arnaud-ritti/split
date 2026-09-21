import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideOptimus } from '@openng/optimus-ui/config';
import { MessageService } from '@openng/optimus-ui/api';
import Lara from '@openng/optimus-ui-themes/lara';
import { routes } from './app.routes';
import { provideOptimusI18n } from './core/i18n/optimus-i18n';
import { acceptLanguageInterceptor } from './core/api/accept-language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // `GroupPage` takes the `:groupId` segment as a signal input.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([acceptLanguageInterceptor])),
    provideClientHydration(withEventReplay()),
    provideOptimus({
      theme: { preset: Lara, options: { darkModeSelector: '.app-dark' } },
      ripple: true,
    }),
    provideOptimusI18n(),
    MessageService,
  ],
};
