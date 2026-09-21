/** Every locale the app ships translations for. French is the default. */
export const APP_LOCALES = ['fr', 'en'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'fr';

/** BCP 47 tags handed to `Intl`, and the `lang` attribute on `<html>`. */
export const LOCALE_TAGS: Record<AppLocale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
};

/** Endonyms: a language is always listed in its own language. */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  fr: 'Français',
  en: 'English',
};

/** The API has no currency of its own; the whole app settles in euros. */
export const CURRENCY = 'EUR';

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}
