import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {authInterceptor} from "./core/interceptors/auth.interceptor";
import {errorInterceptor} from "./core/interceptors/error.interceptor";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeuix/themes/aura';
import {provideAnimations} from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'primeng, app'
          }
        }
      }
    }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ]
};
