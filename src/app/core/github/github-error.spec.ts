import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { toAppError } from './github-error';

describe('toAppError', () => {
  it('maps exhausted GitHub rate limit errors with reset time', () => {
    const resetAtSeconds = 1_800_000_000;
    const error = new HttpErrorResponse({
      status: 403,
      statusText: 'Forbidden',
      url: 'https://api.github.com/search/repositories',
      headers: new HttpHeaders({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(resetAtSeconds),
      }),
    });

    expect(toAppError(error)).toEqual({
      kind: 'rate-limit',
      message: 'GitHub API rate limit reached. Try again when the limit resets.',
      resetAt: new Date(resetAtSeconds * 1000),
      status: 403,
    });
  });

  it('maps status 0 as a network error', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://api.github.com/search/repositories',
    });

    expect(toAppError(error)).toEqual({
      kind: 'network',
      message: 'Could not reach GitHub. Check your connection and try again.',
    });
  });

  it('maps other HTTP failures with status context', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: 'https://api.github.com/search/repositories',
    });

    expect(toAppError(error)).toEqual({
      kind: 'http',
      message: 'GitHub returned 500 Server Error.',
      status: 500,
    });
  });
});
