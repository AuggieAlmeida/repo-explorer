import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { StatusPanelComponent } from '../../shared/status-panel.component';
import { FavoritesService } from '../favorites/favorites.service';
import { RepoDetailPanelComponent } from './repo-detail-panel.component';
import { RepoListComponent } from './repo-list.component';
import { SearchStateService } from './search-state.service';

@Component({
  selector: 'app-search-page',
  imports: [DecimalPipe, RepoDetailPanelComponent, RepoListComponent, StatusPanelComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {
  protected readonly searchState = inject(SearchStateService);
  protected readonly favorites = inject(FavoritesService);
  protected readonly favoriteKeys = computed(
    () => new Set(this.favorites.favorites().map((favorite) => favorite.key)),
  );

  protected search(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchState.search(input.value);
  }
}
