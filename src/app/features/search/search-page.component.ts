import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { StatusPanelComponent } from '../../shared/status-panel.component';
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

  protected search(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchState.search(input.value);
  }
}
