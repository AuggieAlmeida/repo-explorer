import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GithubApiService } from './github-api.service';

describe('GithubApiService', () => {
  let service: GithubApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GithubApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GithubApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('searches repositories with a typed mapped result', () => {
    service.search('angular signals', 2).subscribe((result) => {
      expect(result).toEqual({
        totalCount: 1,
        incompleteResults: false,
        items: [
          {
            id: 460078,
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
        ],
      });
    });

    const request = http.expectOne(
      (req) =>
        req.url === 'https://api.github.com/search/repositories' &&
        req.params.get('q') === 'angular signals' &&
        req.params.get('page') === '2' &&
        req.params.get('per_page') === '30',
    );
    expect(request.request.method).toBe('GET');

    request.flush({
      total_count: 1,
      incomplete_results: false,
      items: [rawRepository()],
    });
  });

  it('loads repository detail on demand by owner and repo name', () => {
    service.getRepo('angular', 'angular').subscribe((detail) => {
      expect(detail).toEqual({
        id: 460078,
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
        forksCount: 27_000,
        openIssuesCount: 1_234,
        licenseName: 'MIT License',
        createdAt: new Date('2014-09-18T16:12:01Z'),
      });
    });

    const request = http.expectOne('https://api.github.com/repos/angular/angular');
    expect(request.request.method).toBe('GET');

    request.flush({
      ...rawRepository(),
      forks_count: 27_000,
      open_issues_count: 1_234,
      license: { name: 'MIT License' },
      created_at: '2014-09-18T16:12:01Z',
    });
  });

  it('serves repeated search pages from memory cache', () => {
    const firstResults: unknown[] = [];
    const secondResults: unknown[] = [];

    service.search('angular', 1).subscribe((result) => firstResults.push(result));

    const request = http.expectOne((req) => req.params.get('q') === 'angular');
    request.flush({
      total_count: 1,
      incomplete_results: false,
      items: [rawRepository()],
    });

    service.search('angular', 1).subscribe((result) => secondResults.push(result));

    http.expectNone((req) => req.params.get('q') === 'angular');
    expect(secondResults).toEqual(firstResults);
  });
});

function rawRepository() {
  return {
    id: 460078,
    name: 'angular',
    full_name: 'angular/angular',
    description: 'Deliver web apps with confidence.',
    html_url: 'https://github.com/angular/angular',
    stargazers_count: 99_000,
    language: 'TypeScript',
    owner: {
      login: 'angular',
      avatar_url: 'https://avatars.githubusercontent.com/u/139426',
      html_url: 'https://github.com/angular',
    },
  };
}
