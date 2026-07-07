import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoDetailPanelComponent } from './repo-detail-panel.component';

describe('RepoDetailPanelComponent', () => {
  let fixture: ComponentFixture<RepoDetailPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepoDetailPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepoDetailPanelComponent);
  });

  it('renders repository details when loaded', () => {
    fixture.componentRef.setInput('state', {
      kind: 'success',
      data: {
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
        forksCount: 27_000,
        openIssuesCount: 1_234,
        licenseName: 'MIT License',
        createdAt: new Date('2014-09-18T16:12:01Z'),
      },
    });

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('angular/angular');
    expect(text).toContain('27,000');
    expect(text).toContain('1,234');
    expect(text).toContain('MIT License');
    expect(text).toContain('Sep 18, 2014');
  });
});
