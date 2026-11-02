import { Injectable, signal } from '@angular/core';
import type { ETaskStatus } from '@brainassistant/contracts';
import type { Task } from 'src/app/shared/models/task.model';
import {
  homeModeForStatus,
  homeModeForTask,
  type HomeContentMode,
} from './helpers/home-content-mode.function';

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

  showTask(task: Pick<Task, 'status' | 'type' | 'conditions'>): void {
    const mode = homeModeForTask(task);
    if (mode) {
      this.mode.set(mode);
    }
  }
}
