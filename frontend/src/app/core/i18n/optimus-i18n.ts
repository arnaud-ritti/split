import { EnvironmentProviders, effect, inject, provideEnvironmentInitializer } from '@angular/core';
import { Optimus } from '@openng/optimus-ui/config';
import { I18nService } from './i18n.service';
import { OPTIMUS_TRANSLATIONS } from './optimus-translations';

/** Keeps the Optimus component strings in step with the app locale. */
export function provideOptimusI18n(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(I18nService);
    const optimus = inject(Optimus);

    effect(() => optimus.setTranslation(OPTIMUS_TRANSLATIONS[i18n.locale()]));
  });
}
