import { Signal } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';
import { I18nService } from './i18n.service';
import { MessageKey } from './messages.fr';

/** The part of a Signal Forms field state that error reporting needs. */
interface ErrorReportingState {
  readonly touched: Signal<boolean>;
  readonly errors: Signal<readonly ValidationError.WithFieldTree[]>;
}

/**
 * The message to show under a field, or `null` while it is still untouched.
 *
 * Waiting for `touched` is what stops a pristine form from greeting someone with
 * "this field is required" on every row; `submit()` marks everything touched, so a
 * rejected submission lights up all the offending fields at once.
 */
export function fieldErrorMessage(
  i18n: I18nService,
  field: ErrorReportingState,
  overrides: ValidationOverrides = {},
): string | null {
  return field.touched() ? firstErrorMessage(i18n, field.errors(), overrides) : null;
}

/** Per-field overrides, keyed by error kind, for when the generic wording is too vague. */
export type ValidationOverrides = Partial<Record<string, MessageKey>>;

/**
 * Turns the first Signal Forms error on a field into a translated sentence.
 *
 * Only the first one is shown: a field that is both empty and malformed has one thing
 * wrong with it as far as the person filling it in is concerned.
 */
function firstErrorMessage(
  i18n: I18nService,
  errors: readonly ValidationError.WithFieldTree[],
  overrides: ValidationOverrides = {},
): string | null {
  const error = errors[0];
  if (!error) {
    return null;
  }

  const override = overrides[error.kind];
  if (override) {
    return i18n.translate(override, {
      max: numberOf(error, 'maxLength'),
      min: numberOf(error, 'min'),
    });
  }

  switch (error.kind) {
    case 'required':
      return i18n.translate('validation.required');
    case 'minLength':
      return i18n.translate('validation.required');
    case 'maxLength':
      return i18n.translate('validation.maxLength', { max: numberOf(error, 'maxLength') });
    case 'min':
      return i18n.translate('validation.min', { min: numberOf(error, 'min') });
    case 'parse':
      return i18n.translate('validation.number');
    default:
      // A custom validator carries its own, already translated, message.
      return error.message ?? i18n.translate('error.badRequest');
  }
}

function numberOf(error: ValidationError.WithFieldTree, property: string): number {
  const value = (error as unknown as Record<string, unknown>)[property];
  return typeof value === 'number' ? value : 0;
}
