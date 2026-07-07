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
              data: { totalCount: 0, incompleteResults: false, items: [] },
            }),
            search,
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

  it('renders the provisional result dump', () => {
    const pre = fixture.nativeElement.querySelector('pre') as HTMLElement;

    expect(pre.textContent).toContain('"totalCount": 0');
  });
});
