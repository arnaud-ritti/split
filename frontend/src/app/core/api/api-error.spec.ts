import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

function problem(status: number, body: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body, url: '/api/groups' });
}

describe('toApiError', () => {
  it('maps a 404 to the not-found message', () => {
    const error = toApiError(
      problem(404, { title: 'Resource not found', detail: 'No such group' }),
    );

    expect(error.messageKey).toBe('error.notFound');
    expect(error.detail).toBe('No such group');
  });

  it('keeps the detail of a 422, which is the part worth reading', () => {
    const detail = 'Member 1 does not belong to group 2';
    const error = toApiError(problem(422, { detail }));

    expect(error.messageKey).toBe('error.unprocessable');
    expect(error.detail).toBe(detail);
  });

  it('joins the field errors of a 400 validation failure', () => {
    const error = toApiError(
      problem(400, {
        detail: undefined,
        errors: [
          { field: 'name', message: 'must not be blank' },
          { field: 'amount', message: 'must be at least 0.01' },
        ],
      }),
    );

    expect(error.messageKey).toBe('error.badRequest');
    expect(error.detail).toBe('name must not be blank · amount must be at least 0.01');
  });

  it('treats a status of 0 as the server being unreachable', () => {
    expect(toApiError(problem(0, null)).messageKey).toBe('error.network');
  });

  it('maps a 500 to the server message', () => {
    expect(toApiError(problem(500, {})).messageKey).toBe('error.server');
  });

  it('survives something that is not an HTTP error at all', () => {
    expect(toApiError(new Error('boom'))).toEqual({ messageKey: 'error.unknown', status: 0 });
  });
});
