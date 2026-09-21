import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { MESSAGES_FR } from './messages.fr';
import { MESSAGES_EN } from './messages.en';

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    i18n = TestBed.inject(I18nService);
  });

  it('starts in French', () => {
    expect(i18n.locale()).toBe('fr');
    expect(i18n.translate('members.title')).toBe('Membres');
  });

  it('switches catalogue when the locale changes', () => {
    i18n.setLocale('en');

    expect(i18n.translate('members.title')).toBe('Members');
  });

  it('interpolates named placeholders', () => {
    expect(i18n.translate('toast.groupCreated', { name: 'Lyon' })).toContain('Lyon');
  });

  it('picks the plural form for the active locale', () => {
    // French treats 0 and 1 alike; English does not.
    expect(i18n.translate('members.count', { count: 0 })).toBe('0 membre');
    expect(i18n.translate('members.count', { count: 1 })).toBe('1 membre');
    expect(i18n.translate('members.count', { count: 4 })).toBe('4 membres');

    i18n.setLocale('en');

    expect(i18n.translate('members.count', { count: 0 })).toBe('0 members');
    expect(i18n.translate('members.count', { count: 1 })).toBe('1 member');
  });

  it('falls back to the key when nothing matches', () => {
    expect(i18n.translate('does.not.exist')).toBe('does.not.exist');
  });

  it('formats money and dates in the active locale', () => {
    const amount = i18n.formatMoney(12.5);
    // Non-breaking spaces differ between environments, so only the parts are asserted.
    expect(amount).toContain('12,50');
    expect(amount).toContain('€');

    expect(i18n.formatDate('2026-03-04T10:00:00Z')).toContain('mars');

    i18n.setLocale('en');
    expect(i18n.formatMoney(12.5)).toContain('12.50');
  });

  it('remembers the chosen locale across instances', () => {
    i18n.setLocale('en');
    TestBed.resetTestingModule();

    expect(TestBed.inject(I18nService).locale()).toBe('en');
  });

  it('translates every key in both catalogues', () => {
    const frKeys = Object.keys(MESSAGES_FR).sort();
    const enKeys = Object.keys(MESSAGES_EN).sort();

    expect(enKeys).toEqual(frKeys);
    expect(Object.values(MESSAGES_EN).every((value) => value.length > 0)).toBe(true);
    expect(Object.values(MESSAGES_FR).every((value) => value.length > 0)).toBe(true);
  });
});
