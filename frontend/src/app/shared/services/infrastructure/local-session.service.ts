import { Injectable } from '@angular/core';
import { LocalSnapshot, LocalStore } from './local-store.service';
import { LEGACY_NGXS_STATE_KEY } from './database.service';

@Injectable({ providedIn: 'root' })
export class LocalSessionService {
  constructor(private readonly localStore: LocalStore) {}

  /**
   * Opens this user's database and reads it. The legacy `@@STATE` blob is
   * removed only after that read succeeds, and its tasks are not imported.
   */
  public async openAndLoad(userId: string): Promise<LocalSnapshot> {
    await this.localStore.open(userId);
    const snapshot = await this.localStore.loadAll();
    localStorage.removeItem(LEGACY_NGXS_STATE_KEY);
    return snapshot;
  }

  public close(): Promise<void> {
    return this.localStore.close();
  }
}
