import { Injectable, InjectionToken, computed, effect, inject, signal } from '@angular/core';

import { RepoOwner, RepoSummary } from '../../core/github/github.types';

const STORAGE_KEY = 'repo-explorer:favorites';

export const FAVORITES_STORAGE = new InjectionToken<Storage | null>('FAVORITES_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const runtime = globalThis as { process?: { versions?: { node?: string } } };
    if (runtime.process?.versions?.node) {
      return null;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  },
});

export interface FavoriteRepo {
  key: string;
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stargazersCount: number;
  language: string | null;
  owner: RepoOwner;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storage = inject(FAVORITES_STORAGE);
  private readonly favoriteMap = signal<Map<string, FavoriteRepo>>(loadFavorites(this.storage));

  readonly favorites = computed(() => Array.from(this.favoriteMap().values()));

  constructor() {
    effect(() => {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.favorites()));
    });
  }

  toggle(repo: RepoSummary | FavoriteRepo): void {
    const favorite = toFavorite(repo);
    const next = new Map(this.favoriteMap());

    if (next.has(favorite.key)) {
      next.delete(favorite.key);
    } else {
      next.set(favorite.key, favorite);
    }

    this.favoriteMap.set(next);
  }

  isFavorite(key: string): boolean {
    return this.favoriteMap().has(key);
  }
}

function toFavorite(repo: RepoSummary | FavoriteRepo): FavoriteRepo {
  if ('key' in repo) {
    return repo;
  }

  return {
    key: repo.fullName,
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    htmlUrl: repo.htmlUrl,
    stargazersCount: repo.stargazersCount,
    language: repo.language,
    owner: repo.owner,
  };
}

function loadFavorites(storage: Storage | null): Map<string, FavoriteRepo> {
  const stored = storage?.getItem(STORAGE_KEY) ?? null;
  if (stored === null) {
    return new Map();
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(parsed.filter(isFavoriteRepo).map((favorite) => [favorite.key, favorite]));
  } catch {
    return new Map();
  }
}

function isFavoriteRepo(value: unknown): value is FavoriteRepo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<FavoriteRepo>;
  return (
    typeof candidate.key === 'string' &&
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.fullName === 'string' &&
    typeof candidate.htmlUrl === 'string' &&
    typeof candidate.stargazersCount === 'number' &&
    typeof candidate.owner?.login === 'string' &&
    typeof candidate.owner.avatarUrl === 'string' &&
    typeof candidate.owner.htmlUrl === 'string'
  );
}
