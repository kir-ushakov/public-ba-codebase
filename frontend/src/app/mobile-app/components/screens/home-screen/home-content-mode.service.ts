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
  readonly selectedTagIds = signal<readonly string[]>([]);

  private ownerId: string | null = null;

  select(mode: HomeContentMode): void {
    this.mode.set(mode);
    if (isHomeSecondaryMode(mode)) {
      this.secondary.set(mode);
    }
  }

  showTag(tagId: string): void {
    this.selectedTagIds.set([tagId]);
  }

  toggleTag(tagId: string): void {
    this.selectedTagIds.update(current =>
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId],
    );
  }

  /** Drops the tag filter when the signed-in account changes. Same account keeps it. */
  bindUser(userId: string | null): void {
    if (this.ownerId === userId) {
      return;
    }
    this.ownerId = userId;
    this.selectedTagIds.set([]);
  }

  clearTag(tagId: string): void {
    this.selectedTagIds.update(current => current.filter(id => id !== tagId));
  }

  /** Drops selected tags that no longer exist. */
  noteTags(ids: readonly string[]): void {
    const known = new Set(ids);
    this.selectedTagIds.update(current => current.filter(id => known.has(id)));
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
