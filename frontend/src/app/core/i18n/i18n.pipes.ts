import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, MessageParams } from './i18n.service';
import { MessageKey } from './messages.fr';

/**
 * `{{ 'members.title' | t }}`, or `{{ 'members.count' | t: { count: 3 } }}`.
 *
 * Impure on purpose: a pure pipe caches on its arguments, so it would keep returning the
 * previous language's string after the locale signal changes.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: MessageKey | string, params?: MessageParams): string {
    return this.i18n.translate(key, params);
  }
}

/** Formats an ISO instant in the active locale. */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | Date | null | undefined, style: 'date' | 'dateTime' = 'date'): string {
    if (!value) {
      return '';
    }
    return style === 'dateTime' ? this.i18n.formatDateTime(value) : this.i18n.formatDate(value);
  }
}
