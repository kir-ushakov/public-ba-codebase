import { Injectable, Injector } from '@angular/core';
import { SyncAvailableContract } from '@brainassistant/contracts';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SyncAction } from '../../state/sync.action';

const RECONNECT_DELAY_MS = 3000;

@Injectable({
  providedIn: 'root',
})
export class ServerSyncSignalService {
  private readonly streamUrl = `${environment.baseUrl}sync/stream?ngsw-bypass=1`;
  private source: EventSource | null = null;
  private generation = 0;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      this.store().dispatch(new SyncAction.Synchronize());
    }
  };

  constructor(private readonly injector: Injector) {}

  public start(): void {
    this.stop();
    this.stopped = false;
    document.addEventListener('visibilitychange', this.onVisibility);
    this.openStream();
  }

  public stop(): void {
    this.stopped = true;
    this.generation += 1;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeStream();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  public handleAvailableVersion(version: number): void {
    const current = this.syncedRevision();
    if (version > current) {
      this.store().dispatch(new SyncAction.Synchronize());
    }
  }

  private openStream(): void {
    if (this.stopped || typeof EventSource === 'undefined') {
      return;
    }
    this.closeStream();
    const generation = ++this.generation;
    const source = new EventSource(this.streamUrl, { withCredentials: true });
    this.source = source;
    source.addEventListener('open', () => {
      if (generation !== this.generation) {
        return;
      }
      this.store().dispatch(new SyncAction.Synchronize());
    });
    source.addEventListener('sync.available', (event: Event) => {
      if (generation !== this.generation) {
        return;
      }
      const version = this.readVersion(event);
      if (version === null) {
        return;
      }
      this.handleAvailableVersion(version);
    });
    source.addEventListener('error', () => {
      if (generation !== this.generation) {
        return;
      }
      this.generation += 1;
      source.close();
      if (this.source === source) {
        this.source = null;
      }
      void this.reopenAfterSync();
    });
  }

  private async reopenAfterSync(): Promise<void> {
    if (this.stopped) {
      return;
    }
    await firstValueFrom(this.store().dispatch(new SyncAction.Synchronize()));
    if (this.stopped) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openStream();
    }, RECONNECT_DELAY_MS);
  }

  private closeStream(): void {
    const source = this.source;
    this.source = null;
    source?.close();
  }

  private readVersion(event: Event): number | null {
    if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(event.data);
      if (!isSyncAvailableEvent(parsed)) {
        return null;
      }
      return parsed.version;
    } catch {
      return null;
    }
  }

  private syncedRevision(): number {
    const snapshot: { sync?: { syncedRevision?: number } } = this.store().snapshot();
    return snapshot.sync?.syncedRevision ?? 0;
  }

  private store(): Store {
    return this.injector.get(Store);
  }
}

function isSyncAvailableEvent(value: unknown): value is SyncAvailableContract.Event {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof value.version === 'number'
  );
}
