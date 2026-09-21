import { DOCUMENT, Service, Signal, computed, effect, inject, signal } from '@angular/core';
import { MESSAGES_FR, MessageCatalogue, MessageKey } from './messages.fr';
import { MESSAGES_EN } from './messages.en';
import {
  APP_LOCALES,
  AppLocale,
  CURRENCY,
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  isAppLocale,
} from './locale';

const CATALOGUES: Record<AppLocale, MessageCatalogue> = {
  fr: MESSAGES_FR,
  en: MESSAGES_EN,
};

const STORAGE_KEY = 'split.locale';

/** Values interpolated into a message. `count` additionally selects the plural form. */
export type MessageParams = Record<string, string | number>;

/**
 * Runtime translation and locale-aware formatting.
 *
 * Runtime rather than build-time (`$localize`) so that a single deployed bundle can switch
 * language without a reload, which is what the language picker in the header needs.
 */
@Service()
export class I18nService {
  private readonly document = inject(DOCUMENT);

  private readonly activeLocale = signal<AppLocale>(this.readStoredLocale() ?? DEFAULT_LOCALE);

  readonly locale: Signal<AppLocale> = this.activeLocale.asReadonly();
  readonly locales = APP_LOCALES;

  /** BCP 47 tag for the active locale, for `Intl` and the `lang` attribute. */
  readonly localeTag = computed(() => LOCALE_TAGS[this.locale()]);

  private readonly catalogue = computed(() => CATALOGUES[this.locale()]);

  private readonly pluralRules = computed(() => new Intl.PluralRules(this.localeTag()));

  private readonly moneyFormat = computed(
    () =>
      new Intl.NumberFormat(this.localeTag(), {
        style: 'currency',
        currency: CURRENCY,
      }),
  );

  private readonly dateFormat = computed(
    () => new Intl.DateTimeFormat(this.localeTag(), { dateStyle: 'long' }),
  );

  private readonly dateTimeFormat = computed(
    () => new Intl.DateTimeFormat(this.localeTag(), { dateStyle: 'medium', timeStyle: 'short' }),
  );

  constructor() {
    effect(() => (this.document.documentElement.lang = this.locale()));
  }

  /** Persisted here rather than in an effect, so the choice survives an immediate reload. */
  setLocale(locale: AppLocale): void {
    this.activeLocale.set(locale);
    this.writeStoredLocale(locale);
  }

  /**
   * Resolves `key` in the active catalogue and interpolates `{placeholders}`.
   *
   * When `params.count` is present the plural suffix chosen by `Intl.PluralRules` is tried
   * first (`key.one`, `key.other`), so French treats 0 and 1 alike while English does not.
   */
  translate(key: MessageKey | string, params?: MessageParams): string {
    const catalogue = this.catalogue();
    const template = this.resolve(catalogue, key, params);

    if (template === undefined) {
      // Surfacing the key beats surfacing an empty element.
      return key;
    }

    return params ? interpolate(template, params) : template;
  }

  formatMoney(amount: number): string {
    return this.moneyFormat().format(amount);
  }

  formatDate(value: string | Date): string {
    return this.dateFormat().format(toDate(value));
  }

  formatDateTime(value: string | Date): string {
    return this.dateTimeFormat().format(toDate(value));
  }

  private resolve(
    catalogue: MessageCatalogue,
    key: string,
    params: MessageParams | undefined,
  ): string | undefined {
    const entries = catalogue as Record<string, string | undefined>;

    if (params && typeof params['count'] === 'number') {
      const category = this.pluralRules().select(params['count']);
      return entries[`${key}.${category}`] ?? entries[`${key}.other`] ?? entries[key];
    }

    return entries[key];
  }

  private readStoredLocale(): AppLocale | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return isAppLocale(stored) ? stored : null;
    } catch {
      // Private browsing, or no window at all during server rendering.
      return null;
    }
  }

  private writeStoredLocale(locale: AppLocale): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // A locale we cannot remember is not worth failing a render over.
    }
  }
}

function interpolate(template: string, params: MessageParams): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
