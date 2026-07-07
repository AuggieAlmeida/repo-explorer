import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RepoDetail } from '../../core/github/github.types';
import { UiState } from '../../shared/ui-state';

@Component({
  selector: 'app-repo-detail-panel',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './repo-detail-panel.component.html',
  styleUrl: './repo-detail-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoDetailPanelComponent {
  readonly state = input.required<UiState<RepoDetail>>();
}
