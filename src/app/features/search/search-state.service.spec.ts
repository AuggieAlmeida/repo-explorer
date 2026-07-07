import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SearchStateService } from './search-state.service';

describe('SearchStateService', () => {
  let service: SearchStateService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [SearchStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SearchStateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify({ ignoreCancelled: true });
    vi.useRealTimers();
  });

  it('debounces typed queries before searching GitHub', async () => {
    service.search('ang');
    service.search('angu');
    service.search('angular');
    await vi.advanceTimersByTimeAsync(299);

    http.expectNone(() => true);

    await vi.advanceTimersByTimeAsync(1);
    const request = http.expectOne((req) => req.params.get('q') === 'angular');
    expect(service.state().kind).toBe('loading');

    request.flush(searchResponse(['angular/angular']));

    expect(service.state()).toEqual({
      kind: 'success',
      data: {
        totalCount: 1,
        incompleteResults: false,
        items: [repo('angular/angular')],
      },
    });
  });

  it('cancels obsolete in-flight searches when a newer query is emitted', async () => {
    service.search('angular');
    await vi.advanceTimersByTimeAsync(300);
    const obsolete = http.expectOne((req) => req.params.get('q') === 'angular');

    service.search('react');
    await vi.advanceTimersByTimeAsync(300);
    const current = http.expectOne((req) => req.params.get('q') === 'react');

    expect(obsolete.cancelled).toBe(true);

    current.flush(searchResponse(['facebook/react']));

    expect(service.state()).toEqual({
      kind: 'success',
      data: {
        totalCount: 1,
        incompleteResults: false,
        items: [repo('facebook/react')],
      },
    });
  });

  it('uses empty state for successful searches without items', async () => {
    service.search('unlikely-empty-term');
    await vi.advanceTimersByTimeAsync(300);

    const request = http.expectOne((req) => req.params.get('q') === 'unlikely-empty-term');
    request.flush({ total_count: 0, incomplete_results: false, items: [] });

    expect(service.state()).toEqual({ kind: 'empty' });
  });

  it('uses error state when GitHub fails', async () => {
    service.search('angular');
    await vi.advanceTimersByTimeAsync(300);

    const request = http.expectOne((req) => req.params.get('q') === 'angular');
    request.flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(service.state()).toEqual({
      kind: 'error',
      error: {
        kind: 'http',
        message: 'GitHub returned 500 Server Error.',
        status: 500,
      },
    });
  });
});

function searchResponse(fullNames: string[]) {
  return {
    total_count: fullNames.length,
    incomplete_results: false,
    items: fullNames.map(repoResponse),
  };
}

function repoResponse(fullName: string) {
  const [owner, name] = fullName.split('/');
  return {
    id: fullName.length,
    name,
    full_name: fullName,
    description: `${fullName} description`,
    html_url: `https://github.com/${fullName}`,
    stargazers_count: 100,
    language: 'TypeScript',
    owner: {
      login: owner,
      avatar_url: `https://avatars.githubusercontent.com/${owner}`,
      html_url: `https://github.com/${owner}`,
    },
  };
}

function repo(fullName: string) {
  const [owner, name] = fullName.split('/');
  return {
    id: fullName.length,
    name,
    fullName,
    description: `${fullName} description`,
    htmlUrl: `https://github.com/${fullName}`,
    stargazersCount: 100,
    language: 'TypeScript',
    owner: {
      login: owner,
      avatarUrl: `https://avatars.githubusercontent.com/${owner}`,
      htmlUrl: `https://github.com/${owner}`,
    },
  };
}
