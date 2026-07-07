import { TestBed } from '@angular/core/testing';

import { RepoSummary } from '../../core/github/github.types';
import { FAVORITES_STORAGE, FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: FAVORITES_STORAGE, useValue: storage }],
    });
  });

  it('toggles repositories by owner/name key', () => {
    const service = TestBed.inject(FavoritesService);

    service.toggle(repo());
    expect(service.isFavorite('angular/angular')).toBe(true);
    expect(service.favorites()).toEqual([
      {
        key: 'angular/angular',
        id: 1,
        name: 'angular',
        fullName: 'angular/angular',
        description: 'Deliver web apps with confidence.',
        htmlUrl: 'https://github.com/angular/angular',
        stargazersCount: 99_000,
        language: 'TypeScript',
        owner: {
          login: 'angular',
          avatarUrl: 'https://avatars.githubusercontent.com/u/139426',
          htmlUrl: 'https://github.com/angular',
        },
      },
    ]);

    service.toggle(repo());
    expect(service.isFavorite('angular/angular')).toBe(false);
    expect(service.favorites()).toEqual([]);
  });

  it('persists favorites to localStorage and hydrates them later', () => {
    const service = TestBed.inject(FavoritesService);
    service.toggle(repo());
    TestBed.tick();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: FAVORITES_STORAGE, useValue: storage }],
    });

    const hydrated = TestBed.inject(FavoritesService);

    expect(JSON.parse(storage.getItem('repo-explorer:favorites') ?? '[]')).toHaveLength(1);
    expect(hydrated.isFavorite('angular/angular')).toBe(true);
    expect(hydrated.favorites()[0]?.fullName).toBe('angular/angular');
  });

  it('ignores corrupted localStorage data', () => {
    storage.setItem('repo-explorer:favorites', '{not-json');

    const service = TestBed.inject(FavoritesService);

    expect(service.favorites()).toEqual([]);
  });
});

function repo(): RepoSummary {
  return {
    id: 1,
    name: 'angular',
    fullName: 'angular/angular',
    description: 'Deliver web apps with confidence.',
    htmlUrl: 'https://github.com/angular/angular',
    stargazersCount: 99_000,
    language: 'TypeScript',
    owner: {
      login: 'angular',
      avatarUrl: 'https://avatars.githubusercontent.com/u/139426',
      htmlUrl: 'https://github.com/angular',
    },
  };
}

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key: string) => items.get(key) ?? null,
    key: (index: number) => Array.from(items.keys())[index] ?? null,
    removeItem: (key: string) => items.delete(key),
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
}
