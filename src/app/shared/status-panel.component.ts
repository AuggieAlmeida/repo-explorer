import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

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
  private readonly now = signal(Date.now());

  constructor() {
    effect((onCleanup) => {
      const current = this.state();
      if (
        current.kind !== 'error' ||
        current.error.kind !== 'rate-limit' ||
        !current.error.resetAt
      ) {
        return;
      }

      this.now.set(Date.now());
      const timer = window.setInterval(() => this.now.set(Date.now()), 1000);
      onCleanup(() => window.clearInterval(timer));
    });
  }

  protected resetCountdown(resetAt: Date): string {
    const remainingMs = Math.max(0, resetAt.getTime() - this.now());
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  }
}
