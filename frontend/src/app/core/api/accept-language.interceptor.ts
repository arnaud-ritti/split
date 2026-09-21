import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { LOCALE_TAGS } from '../i18n/locale';

/**
 * Asks the API for messages in the language the UI is showing.
 *
 * Bean validation messages come straight from the server (`doit être supérieur ou égal à
 * 0.01`), so without this header they would follow the JVM's default locale rather than
 * the one the person picked.
 */
export const acceptLanguageInterceptor: HttpInterceptorFn = (request, next) => {
  const locale = inject(I18nService).locale();
  const tag = LOCALE_TAGS[locale];

  return next(
    request.clone({
      setHeaders: { 'Accept-Language': `${tag},${locale};q=0.9` },
    }),
  );
};
