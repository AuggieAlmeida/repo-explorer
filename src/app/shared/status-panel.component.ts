import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiState } from './ui-state';

@Component({
  selector: 'app-status-panel',
  imports: [DatePipe],
  templateUrl: './status-panel.component.html',
  styleUrl: './status-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPanelComponent {
  readonly state = input.required<UiState<unknown>>();
  readonly retry = output<void>();
}
