import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { GithubApiService } from '../../core/github/github-api.service';
import { toAppError } from '../../core/github/github-error';
import { RepoSearchResult } from '../../core/github/github.types';
import { UiState, empty, errorState, idle, loading, success } from '../../shared/ui-state';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private readonly api = inject(GithubApiService);
  private readonly queries = new Subject<string>();

  readonly query = signal('');
  readonly state = toSignal(
    this.queries.pipe(
      map((query) => query.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.length < 2) {
          return of(idle<RepoSearchResult>());
        }

        return this.api.search(query).pipe(
          map((result) =>
            result.items.length === 0
              ? empty<RepoSearchResult>()
              : success<RepoSearchResult>(result),
          ),
          catchError((error: unknown) => of(errorState<RepoSearchResult>(toAppError(error)))),
          startWith(loading<RepoSearchResult>()),
        );
      }),
    ),
    { initialValue: idle<RepoSearchResult>() },
  );

  search(query: string): void {
    this.query.set(query);
    this.queries.next(query);
  }

  retry(): void {
    this.queries.next(this.query());
  }
}
