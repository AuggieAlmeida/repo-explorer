import { AppError } from '../core/github/github-error';

export type UiState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'empty' }
  | { kind: 'error'; error: AppError };

export function idle<T>(): UiState<T> {
  return { kind: 'idle' };
}

export function loading<T>(): UiState<T> {
  return { kind: 'loading' };
}

export function success<T>(data: T): UiState<T> {
  return { kind: 'success', data };
}

export function empty<T>(): UiState<T> {
  return { kind: 'empty' };
}

export function errorState<T>(error: AppError): UiState<T> {
  return { kind: 'error', error };
}
