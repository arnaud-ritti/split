import { Service, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import { I18nService, MessageParams } from './i18n/i18n.service';
import { MessageKey } from './i18n/messages.fr';
import { ApiError } from './api/api-error';

/** Translated toasts, so no component has to assemble a `MessageService` payload itself. */
@Service()
export class Notifications {
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  success(key: MessageKey, params?: MessageParams): void {
    this.messages.add({
      severity: 'success',
      summary: this.i18n.translate('toast.success'),
      detail: this.i18n.translate(key, params),
      life: 4000,
    });
  }

  failure(error: ApiError): void {
    this.messages.add({
      severity: 'error',
      summary: this.i18n.translate('error.title'),
      detail: error.detail ?? this.i18n.translate(error.messageKey),
      life: 8000,
    });
  }
}
