import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RepoSummary } from '../../core/github/github.types';

@Component({
  selector: 'app-repo-list-item',
  imports: [DecimalPipe],
  templateUrl: './repo-list-item.component.html',
  styleUrl: './repo-list-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoListItemComponent {
  readonly repo = input.required<RepoSummary>();
  readonly favorite = input(false);
  readonly selected = output<RepoSummary>();
  readonly favoriteToggled = output<RepoSummary>();
}
