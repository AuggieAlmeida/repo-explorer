import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { RepoListComponent } from '../search/repo-list.component';
import { FavoritesService } from './favorites.service';

@Component({
  selector: 'app-favorites-page',
  imports: [RepoListComponent],
  templateUrl: './favorites-page.component.html',
  styleUrl: './favorites-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPageComponent {
  protected readonly favorites = inject(FavoritesService);
  protected readonly favoriteKeys = computed(
    () => new Set(this.favorites.favorites().map((favorite) => favorite.key)),
  );
}
