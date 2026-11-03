import { Injectable, signal } from '@angular/core';
import type { ETaskStatus } from '@brainassistant/contracts';
import type { Task } from 'src/app/shared/models/task.model';
import {
  homeModeForStatus,
  homeModeForTask,
  isHomeSecondaryMode,
  type HomeContentMode,
  type HomeSecondaryMode,
} from './helpers/home-content-mode.function';

@Injectable({ providedIn: 'root' })
export class HomeContentModeService {
  readonly mode = signal<HomeContentMode>('active');
  readonly secondary = signal<HomeSecondaryMode>('todo');

  select(mode: HomeContentMode): void {
    this.mode.set(mode);
    if (isHomeSecondaryMode(mode)) {
      this.secondary.set(mode);
    }
  }

  showStatus(status: ETaskStatus | undefined): void {
    const mode = homeModeForStatus(status);
    if (mode) {
      this.select(mode);
    }
  }

  showTask(task: Pick<Task, 'status' | 'type' | 'conditions'>): void {
    const mode = homeModeForTask(task);
    if (mode) {
      this.select(mode);
    }
  }
}
