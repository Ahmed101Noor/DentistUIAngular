import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';

import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

// تسجيل اللغة العربية
registerLocaleData(localeAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(), // ✅ مهمة لتفادي مشاكل التنقل الأولى
      withRouterConfig({ onSameUrlNavigation: 'reload' }) // ✅ الطريقة الصحيحة لتفعيل إعادة التحميل عند نفس الـ route
    ),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'ar' }
  ]
};
