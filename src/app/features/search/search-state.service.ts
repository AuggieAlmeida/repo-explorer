import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
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
  take,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GithubApiService } from '../../core/github/github-api.service';
import { toAppError } from '../../core/github/github-error';
import { RepoDetail, RepoSearchResult, RepoSummary } from '../../core/github/github.types';
import { UiState, empty, errorState, idle, loading, success } from '../../shared/ui-state';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private readonly api = inject(GithubApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = new Subject<string>();
  private readonly selections = new Subject<RepoSummary | null>();
  private readonly searchState = signal<UiState<RepoSearchResult>>(idle<RepoSearchResult>());
  private readonly currentPage = signal(1);

  readonly query = signal('');
  readonly selectedRepo = signal<RepoSummary | null>(null);
  readonly loadingMore = signal(false);
  readonly state = this.searchState.asReadonly();
  readonly canLoadMore = computed(() => {
    const state = this.searchState();
    return state.kind === 'success' && state.data.items.length < state.data.totalCount;
  });
  readonly detailState = toSignal(
    this.selections.pipe(
      switchMap((repo) => {
        if (repo === null) {
          return of(idle<RepoDetail>());
        }

        const [owner, name] = repo.fullName.split('/');
        return this.api.getRepo(owner, name).pipe(
          map((detail) => success<RepoDetail>(detail)),
          catchError((error: unknown) => of(errorState<RepoDetail>(toAppError(error)))),
          startWith(loading<RepoDetail>()),
        );
      }),
    ),
    { initialValue: idle<RepoDetail>() },
  );

  constructor() {
    this.queries
      .pipe(
        map((query) => query.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.currentPage.set(1);

          if (query.length < 2) {
            return of(idle<RepoSearchResult>());
          }

          return this.api.search(query, 1).pipe(
            map((result) =>
              result.items.length === 0
                ? empty<RepoSearchResult>()
                : success<RepoSearchResult>(result),
            ),
            catchError((error: unknown) => of(errorState<RepoSearchResult>(toAppError(error)))),
            startWith(loading<RepoSearchResult>()),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.searchState.set(state));
  }

  search(query: string): void {
    this.query.set(query);
    this.selectedRepo.set(null);
    this.selections.next(null);
    this.queries.next(query);
  }

  retry(): void {
    this.queries.next(this.query());
  }

  select(repo: RepoSummary): void {
    this.selectedRepo.set(repo);
    this.selections.next(repo);
  }

  loadMore(): void {
    const current = this.searchState();
    if (current.kind !== 'success' || this.loadingMore() || !this.canLoadMore()) {
      return;
    }

    const nextPage = this.currentPage() + 1;
    this.loadingMore.set(true);

    this.api
      .search(this.query(), nextPage)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const latest = this.searchState();
          if (latest.kind !== 'success') {
            this.loadingMore.set(false);
            return;
          }

          this.currentPage.set(nextPage);
          this.searchState.set(
            success<RepoSearchResult>({
              totalCount: result.totalCount,
              incompleteResults: latest.data.incompleteResults || result.incompleteResults,
              items: [...latest.data.items, ...result.items],
            }),
          );
          this.loadingMore.set(false);
        },
        error: (error: unknown) => {
          this.searchState.set(errorState<RepoSearchResult>(toAppError(error)));
          this.loadingMore.set(false);
        },
      });
  }
}
