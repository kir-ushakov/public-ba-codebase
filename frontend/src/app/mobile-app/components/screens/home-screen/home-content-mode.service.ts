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
  readonly selectedTagId = signal<string | null>(null);

  private ownerId: string | null = null;
  private seenPins = false;
  private pinnedIds = new Set<string>();

  select(mode: HomeContentMode): void {
    this.mode.set(mode);
    if (isHomeSecondaryMode(mode)) {
      this.secondary.set(mode);
    }
  }

  showTag(tagId: string): void {
    this.selectedTagId.set(tagId);
  }

  toggleTag(tagId: string): void {
    this.selectedTagId.update(current => (current === tagId ? null : tagId));
  }

  /** Drops the tag filter when the signed-in account changes. Same account keeps it. */
  bindUser(userId: string | null): void {
    if (this.ownerId === userId) {
      return;
    }
    this.ownerId = userId;
    this.selectedTagId.set(null);
    this.seenPins = false;
    this.pinnedIds = new Set();
  }

  /**
   * Clears the filter when the selected tag was pinned and no longer is.
   * A tag opened from the Tags page while unpinned stays selected.
   */
  notePinned(ids: readonly string[]): void {
    const next = new Set(ids);
    if (this.seenPins) {
      const selected = this.selectedTagId();
      if (selected && this.pinnedIds.has(selected) && !next.has(selected)) {
        this.selectedTagId.set(null);
      }
    }
    this.pinnedIds = next;
    this.seenPins = true;
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
