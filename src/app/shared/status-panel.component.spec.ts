import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { StatusPanelComponent } from './status-panel.component';

describe('StatusPanelComponent', () => {
  let fixture: ComponentFixture<StatusPanelComponent>;

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusPanelComponent);
  });

  it('renders rate limit errors with reset time and retry action', () => {
    const retry = vi.fn();
    fixture.componentRef.setInput('state', {
      kind: 'error',
      error: {
        kind: 'rate-limit',
        message: 'GitHub API rate limit reached. Try again when the limit resets.',
        resetAt: new Date('2026-07-07T17:00:00Z'),
        status: 403,
      },
    });
    fixture.componentInstance.retry.subscribe(retry);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('GitHub API rate limit reached');
    expect(text).toContain('Reset');
    expect(text).toContain('Resets in');

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('ticks rate limit countdown while the reset error is visible', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T16:59:58Z'));

    fixture.componentRef.setInput('state', {
      kind: 'error',
      error: {
        kind: 'rate-limit',
        message: 'GitHub API rate limit reached. Try again when the limit resets.',
        resetAt: new Date('2026-07-07T17:00:00Z'),
        status: 403,
      },
    });

    fixture.detectChanges();

    expect(vi.getTimerCount()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Resets in 2s');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Resets in 1s');
  });
});
