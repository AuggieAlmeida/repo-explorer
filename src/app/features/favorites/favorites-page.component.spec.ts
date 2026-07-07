import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { FavoritesService } from './favorites.service';
import { FavoritesPageComponent } from './favorites-page.component';

describe('FavoritesPageComponent', () => {
  let fixture: ComponentFixture<FavoritesPageComponent>;
  const toggle = vi.fn();

  beforeEach(async () => {
    toggle.mockReset();

    await TestBed.configureTestingModule({
      imports: [FavoritesPageComponent],
      providers: [
        {
          provide: FavoritesService,
          useValue: {
            favorites: signal([
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
            ]),
            toggle,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesPageComponent);
    fixture.detectChanges();
  });

  it('renders persisted favorites', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Favorites');
    expect(text).toContain('angular/angular');
  });

  it('removes a favorite through the list action', () => {
    const button = fixture.nativeElement.querySelector('.favorite-button') as HTMLButtonElement;

    button.click();

    expect(toggle).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'angular/angular' }));
  });
});
