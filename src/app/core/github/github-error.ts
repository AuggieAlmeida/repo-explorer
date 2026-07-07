import { HttpErrorResponse } from '@angular/common/http';

export type AppError =
  | {
      kind: 'rate-limit';
      message: string;
      resetAt?: Date;
      status: number;
    }
  | {
      kind: 'network';
      message: string;
    }
  | {
      kind: 'http';
      message: string;
      status: number;
    };

export function toAppError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      kind: 'http',
      message: 'GitHub returned an unexpected error.',
      status: 500,
    };
  }

  if (error.status === 0) {
    return {
      kind: 'network',
      message: 'Could not reach GitHub. Check your connection and try again.',
    };
  }

  const remaining = error.headers.get('x-ratelimit-remaining');
  if ((error.status === 403 || error.status === 429) && remaining === '0') {
    return {
      kind: 'rate-limit',
      message: 'GitHub API rate limit reached. Try again when the limit resets.',
      resetAt: parseRateLimitReset(error.headers.get('x-ratelimit-reset')),
      status: error.status,
    };
  }

  return {
    kind: 'http',
    message: `GitHub returned ${error.status} ${error.statusText}.`,
    status: error.status,
  };
}

function parseRateLimitReset(value: string | null): Date | undefined {
  if (value === null) {
    return undefined;
  }

  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    return undefined;
  }

  return new Date(seconds * 1000);
}
