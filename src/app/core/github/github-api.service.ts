import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import {
  GitHubRepositoryDetailResponse,
  GitHubRepositoryResponse,
  GitHubSearchResponse,
  RepoDetail,
  RepoSearchResult,
  RepoSummary,
} from './github.types';

const GITHUB_API_URL = 'https://api.github.com';
const PAGE_SIZE = 30;

@Injectable({ providedIn: 'root' })
export class GithubApiService {
  private readonly http = inject(HttpClient);
  private readonly searchCache = new Map<string, RepoSearchResult>();

  search(term: string, page = 1): Observable<RepoSearchResult> {
    const cacheKey = searchCacheKey(term, page);
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    const params = new HttpParams()
      .set('q', term)
      .set('page', page)
      .set('per_page', PAGE_SIZE);

    return this.http
      .get<GitHubSearchResponse>(`${GITHUB_API_URL}/search/repositories`, { params })
      .pipe(
        map(mapSearchResult),
        tap((result) => this.searchCache.set(cacheKey, result)),
      );
  }

  getRepo(owner: string, name: string): Observable<RepoDetail> {
    const safeOwner = encodeURIComponent(owner);
    const safeName = encodeURIComponent(name);

    return this.http
      .get<GitHubRepositoryDetailResponse>(`${GITHUB_API_URL}/repos/${safeOwner}/${safeName}`)
      .pipe(map(mapRepoDetail));
  }
}

function searchCacheKey(term: string, page: number): string {
  return `${term.trim().toLowerCase()}::${page}`;
}

function mapSearchResult(response: GitHubSearchResponse): RepoSearchResult {
  return {
    totalCount: response.total_count,
    incompleteResults: response.incomplete_results,
    items: response.items.map(mapRepoSummary),
  };
}

function mapRepoSummary(repo: GitHubRepositoryResponse): RepoSummary {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    stargazersCount: repo.stargazers_count,
    language: repo.language,
    owner: {
      login: repo.owner.login,
      avatarUrl: repo.owner.avatar_url,
      htmlUrl: repo.owner.html_url,
    },
  };
}

function mapRepoDetail(repo: GitHubRepositoryDetailResponse): RepoDetail {
  return {
    ...mapRepoSummary(repo),
    forksCount: repo.forks_count,
    openIssuesCount: repo.open_issues_count,
    licenseName: repo.license?.name ?? null,
    createdAt: new Date(repo.created_at),
  };
}
