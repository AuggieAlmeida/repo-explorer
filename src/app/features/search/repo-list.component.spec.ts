import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RepoSummary } from '../../core/github/github.types';
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
  ];

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
});
