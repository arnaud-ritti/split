import { Component, inject } from '@angular/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { I18nService } from './i18n.service';
import { AppLocale, LOCALE_NAMES } from './locale';
import { TranslatePipe } from './i18n.pipes';

/**
 * Header control that switches the active locale.
 *
 * The `pButton` directive on native buttons rather than `<p-button>`: `aria-pressed` and
 * `lang` then land on the real `<button>` instead of a wrapper element.
 */
@Component({
  selector: 'app-locale-switcher',
  imports: [ButtonModule, TranslatePipe],
  template: `
    <div class="locale-switcher" role="group" [attr.aria-label]="'app.language' | t">
      @for (locale of i18n.locales; track locale) {
        <button
          pButton
          type="button"
          size="small"
          severity="secondary"
          [text]="i18n.locale() !== locale"
          [lang]="locale"
          [attr.aria-pressed]="i18n.locale() === locale"
          (click)="i18n.setLocale(locale)"
        >
          <span pButtonLabel>{{ names[locale] }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .locale-switcher {
      display: flex;
      gap: 0.25rem;
    }
  `,
})
export class LocaleSwitcher {
  protected readonly i18n = inject(I18nService);
  protected readonly names: Record<AppLocale, string> = LOCALE_NAMES;
}
