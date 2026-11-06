import { Injectable, NgZone, signal } from '@angular/core';
import { msUntilNextLocalMidnight, taskTileDayKey } from './helpers/format-task-tile-date.function';

@Injectable({ providedIn: 'root' })
export class TaskTileCalendar {
  readonly dayKey = signal(taskTileDayKey(new Date()));

  private users = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listening = false;

  constructor(private readonly zone: NgZone) {
    this.onVisible = this.onVisible.bind(this);
  }

  retain(): void {
    this.users += 1;
    if (this.users !== 1) {
      return;
    }
    this.listen();
    this.catchUp();
    this.arm();
  }

  release(): void {
    this.users = Math.max(0, this.users - 1);
    if (this.users !== 0) {
      return;
    }
    this.disarm();
    this.unlisten();
  }

  private catchUp(): void {
    const next = taskTileDayKey(new Date());
    if (next !== this.dayKey()) {
      this.dayKey.set(next);
    }
  }

  private refresh(): void {
    const next = taskTileDayKey(new Date());
    const dayChanged = next !== this.dayKey();
    if (!dayChanged && this.timer !== null) {
      return;
    }

    this.zone.run(() => {
      if (dayChanged) {
        this.dayKey.set(next);
      }
      if (this.users === 0) {
        this.disarm();
        return;
      }
      this.arm();
    });
  }

  private arm(): void {
    this.disarm();
    this.timer = scheduleOutside(() => {
      this.timer = null;
      this.refresh();
    }, msUntilNextLocalMidnight(new Date()));
  }

  private disarm(): void {
    if (this.timer === null) {
      return;
    }
    clearScheduled(this.timer);
    this.timer = null;
  }

  private listen(): void {
    if (this.listening) {
      return;
    }
    document.addEventListener('visibilitychange', this.onVisible);
    this.listening = true;
  }

  private unlisten(): void {
    if (!this.listening) {
      return;
    }
    document.removeEventListener('visibilitychange', this.onVisible);
    this.listening = false;
  }

  private onVisible(): void {
    if (document.visibilityState !== 'visible') {
      return;
    }
    this.refresh();
  }
}

function scheduleOutside(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
  const start = (zoneOriginal('setTimeout') ?? setTimeout) as typeof setTimeout;
  const handle = start(callback, delay);
  (handle as { unref?: () => void }).unref?.();
  return handle;
}

function clearScheduled(handle: ReturnType<typeof setTimeout>): void {
  const clear = (zoneOriginal('clearTimeout') ?? clearTimeout) as typeof clearTimeout;
  clear(handle);
}

function zoneOriginal(name: 'setTimeout' | 'clearTimeout'): unknown {
  const zone = (globalThis as { Zone?: { __symbol__?: (key: string) => string } }).Zone;
  const symbol = zone?.__symbol__?.(name);
  if (!symbol) {
    return undefined;
  }
  const original = (globalThis as Record<string, unknown>)[symbol];
  return typeof original === 'function' ? original : undefined;
}
