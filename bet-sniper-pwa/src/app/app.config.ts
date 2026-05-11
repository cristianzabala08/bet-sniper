import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withViewTransitions,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Imports de traducción
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  TranslateHttpLoader,
  provideTranslateHttpLoader,
} from '@ngx-translate/http-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideHttpClient(withInterceptors([sessionInterceptor, authInterceptor])),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // 1. Configuramos dónde están los archivos (Esto arregla el error del CONFIG)
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),

    // 2. Inicializamos el TranslateModule
    importProvidersFrom(
      MatSnackBarModule,
      TranslateModule.forRoot({
        fallbackLang: 'es', // Usamos fallbackLang en lugar de defaultLanguage (deprecado)
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader, // Usamos useClass en lugar de useFactory
        },
      }),
    ),
  ],
};
