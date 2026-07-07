import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RepoDetail, RepoSummary } from '../../core/github/github.types';
import { RepoListComponent } from './repo-list.component';

describe('RepoListComponent', () => {
  let fixture: ComponentFixture<RepoListComponent>;
  const repos: RepoSummary[] = [
    {
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
    {
      id: 2,
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      htmlUrl: 'https://github.com/facebook/react',
      stargazersCount: 240_000,
      language: 'JavaScript',
      owner: {
        login: 'facebook',
        avatarUrl: 'https://avatars.githubusercontent.com/u/69631',
        htmlUrl: 'https://github.com/facebook',
      },
    },
  ];
  const reactDetail: RepoDetail = {
    ...repos[1],
    forksCount: 49_000,
    openIssuesCount: 1_100,
    licenseName: 'MIT License',
    createdAt: new Date('2013-05-24T16:15:54Z'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepoListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepoListComponent);
    fixture.componentRef.setInput('repos', repos);
    fixture.detectChanges();
  });

  it('renders repository summary fields', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('angular/angular');
    expect(text).toContain('angular');
    expect(text).toContain('Deliver web apps with confidence.');
    expect(text).toContain('99,000');
    expect(text).toContain('TypeScript');
  });

  it('emits selection when a repository is clicked', () => {
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(selected).toHaveBeenCalledWith(repos[0]);
  });

  it('emits favorite toggles from list items', () => {
    const favoriteToggled = vi.fn();
    fixture.componentInstance.favoriteToggled.subscribe(favoriteToggled);

    const button = fixture.nativeElement.querySelector('.favorite-button') as HTMLButtonElement;
    button.click();

    expect(favoriteToggled).toHaveBeenCalledWith(repos[0]);
  });

  it('renders repository detail directly after the selected repository', () => {
    fixture.componentRef.setInput('selectedRepo', repos[1]);
    fixture.componentRef.setInput('detailState', { kind: 'success', data: reactDetail });
    fixture.detectChanges();

    const listEntries = [
      ...fixture.nativeElement.querySelectorAll('.repo-list-entry'),
    ] as HTMLElement[];
    const selectedDetail = listEntries[1].querySelector('app-repo-detail-panel');

    expect(listEntries).toHaveLength(2);
    expect(listEntries[0].querySelector('app-repo-detail-panel')).toBeNull();
    expect(selectedDetail).not.toBeNull();
    expect(selectedDetail?.textContent).toContain('facebook/react');
    expect(selectedDetail?.textContent).toContain('49,000');
  });
});
