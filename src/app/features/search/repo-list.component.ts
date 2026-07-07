import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RepoSummary } from '../../core/github/github.types';
import { RepoListItemComponent } from './repo-list-item.component';

@Component({
  selector: 'app-repo-list',
  imports: [RepoListItemComponent],
  templateUrl: './repo-list.component.html',
  styleUrl: './repo-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoListComponent {
  readonly repos = input.required<RepoSummary[]>();
  readonly favoriteKeys = input<ReadonlySet<string>>(new Set());
  readonly selected = output<RepoSummary>();
  readonly favoriteToggled = output<RepoSummary>();
}
