import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { SearchStateService } from './search-state.service';
import { SearchPageComponent } from './search-page.component';

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  const search = vi.fn();

  beforeEach(async () => {
    search.mockReset();

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        {
          provide: SearchStateService,
          useValue: {
            query: signal(''),
            state: signal({
              kind: 'success',
              data: {
                totalCount: 1,
                incompleteResults: false,
                items: [
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
                ],
              },
            }),
            detailState: signal({ kind: 'idle' }),
            search,
            select: vi.fn(),
            retry: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    fixture.detectChanges();
  });

  it('searches when the input changes', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'angular';
    input.dispatchEvent(new Event('input'));

    expect(search).toHaveBeenCalledWith('angular');
  });

  it('renders the result summary and repository list', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('1 repositories found');
    expect(text).toContain('angular/angular');
  });
});
