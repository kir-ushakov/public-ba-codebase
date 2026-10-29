import { Injectable, signal } from '@angular/core';
import type { ETaskStatus } from '@brainassistant/contracts';
import { homeModeForStatus, type HomeContentMode } from './helpers/home-content-mode.function';

@Injectable({ providedIn: 'root' })
export class HomeContentModeService {
  readonly mode = signal<HomeContentMode>('active');

  select(mode: HomeContentMode): void {
    this.mode.set(mode);
  }

  showStatus(status: ETaskStatus | undefined): void {
    const mode = homeModeForStatus(status);
    if (mode) {
      this.mode.set(mode);
    }
  }
}
