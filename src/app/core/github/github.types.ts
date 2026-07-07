export interface RepoOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stargazersCount: number;
  language: string | null;
  owner: RepoOwner;
}

export interface RepoSearchResult {
  totalCount: number;
  incompleteResults: boolean;
  items: RepoSummary[];
}

export interface RepoDetail extends RepoSummary {
  forksCount: number;
  openIssuesCount: number;
  licenseName: string | null;
  createdAt: Date;
}

export interface GitHubOwnerResponse {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  owner: GitHubOwnerResponse;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepositoryResponse[];
}

export interface GitHubRepositoryDetailResponse extends GitHubRepositoryResponse {
  forks_count: number;
  open_issues_count: number;
  license: { name: string } | null;
  created_at: string;
}
