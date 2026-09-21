import { HttpErrorResponse } from '@angular/common/http';
import { MessageKey } from '../i18n/messages.fr';

/** One field rejected by bean validation, as `ApiExceptionHandler` reports it. */
interface FieldError {
  readonly field?: string;
  readonly message?: string;
}

/** The RFC 9457 `application/problem+json` body the API returns for every error. */
interface ProblemDetail {
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: readonly (FieldError | string)[];
}

/**
 * An API failure reduced to something a template can show: a translation key for the
 * general case, plus the server's own `detail` when it carries the useful part (the 422 on
 * a member that does not belong to the group, for instance).
 */
export interface ApiError {
  readonly messageKey: MessageKey;
  readonly detail?: string;
  readonly status: number;
}

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { messageKey: 'error.unknown', status: 0 };
  }

  const problem = asProblemDetail(error.error);
  const detail = problem?.detail ?? fieldMessages(problem);

  return {
    status: error.status,
    detail,
    messageKey: messageKeyFor(error.status),
  };
}

function messageKeyFor(status: number): MessageKey {
  // Status 0 is the browser refusing to tell us more than "it failed".
  if (status === 0) {
    return 'error.network';
  }
  if (status === 404) {
    return 'error.notFound';
  }
  if (status === 422) {
    return 'error.unprocessable';
  }
  if (status >= 500) {
    return 'error.server';
  }
  if (status >= 400) {
    return 'error.badRequest';
  }
  return 'error.unknown';
}

function asProblemDetail(body: unknown): ProblemDetail | null {
  return body !== null && typeof body === 'object' ? (body as ProblemDetail) : null;
}

function fieldMessages(problem: ProblemDetail | null): string | undefined {
  if (!problem?.errors?.length) {
    return undefined;
  }

  return problem.errors
    .map((entry) =>
      typeof entry === 'string' ? entry : [entry.field, entry.message].filter(Boolean).join(' '),
    )
    .filter((message) => message.length > 0)
    .join(' · ');
}
