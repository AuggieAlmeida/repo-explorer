import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RepoDetail, RepoSummary } from '../../core/github/github.types';
import { UiState, idle } from '../../shared/ui-state';
import { RepoDetailPanelComponent } from './repo-detail-panel.component';
import { RepoListItemComponent } from './repo-list-item.component';

@Component({
  selector: 'app-repo-list',
  imports: [RepoDetailPanelComponent, RepoListItemComponent],
  templateUrl: './repo-list.component.html',
  styleUrl: './repo-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoListComponent {
  readonly repos = input.required<RepoSummary[]>();
  readonly favoriteKeys = input<ReadonlySet<string>>(new Set());
  readonly selectedRepo = input<RepoSummary | null>(null);
  readonly detailState = input<UiState<RepoDetail>>(idle<RepoDetail>());
  readonly selected = output<RepoSummary>();
  readonly favoriteToggled = output<RepoSummary>();
}
