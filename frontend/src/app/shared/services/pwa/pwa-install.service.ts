import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Define the interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private static readonly STORAGE_KEYS = {
    dismissed: 'ba.pwaInstall.dismissed.v1',
  } as const;

  private static readonly DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installPromptAvailable$ = new BehaviorSubject<boolean>(false);
  private isPWAInstalled$ = new BehaviorSubject<boolean>(false);
  private hasShownDialogThisSession = false;

  constructor() {
    this.setupPWAInstallPrompt();
    this.checkIfPWAInstalled();
  }

  public get installPromptAvailable(): Observable<boolean> {
    return this.installPromptAvailable$.asObservable();
  }

  public get isPWAInstalled(): Observable<boolean> {
    return this.isPWAInstalled$.asObservable();
  }

  public async installPWA(): Promise<void> {
    try {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        if (outcome === 'accepted') {
          this.isPWAInstalled$.next(true);
          this.clearDismissed();
        }

        this.deferredPrompt = null;
        this.installPromptAvailable$.next(false);
      } else {
        throw new Error('Install prompt not available');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      throw error;
    }
  }

  public dismissInstallDialog(): void {
    this.markDismissed();
    this.installPromptAvailable$.next(false);
  }

  public isInstallPromptAvailable(): boolean {
    return this.deferredPrompt !== null;
  }

  public shouldShowInstallDialog(): boolean {
    if (this.hasShownDialogThisSession) return false;
    if (this.isDismissed()) return false;
    if (this.isRunningStandalone()) return false;
    return this.deferredPrompt !== null;
  }

  public markDialogShownThisSession(): void {
    this.hasShownDialogThisSession = true;
  }

  private setupPWAInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;

      // Notify that install prompt is available
      const canShow = this.shouldShowInstallDialog();
      this.installPromptAvailable$.next(canShow);
      console.log(`PWA install prompt available (canShowDialog=${canShow})`);
    });

    window.addEventListener('appinstalled', () => {
      this.isPWAInstalled$.next(true);
      this.clearDismissed();
      this.deferredPrompt = null;
      this.installPromptAvailable$.next(false);
      console.log('PWA installed');
    });
  }

  private checkIfPWAInstalled(): void {
    if (this.isRunningStandalone()) {
      this.isPWAInstalled$.next(true);
      console.log('PWA is already installed and running in standalone mode');
    }
  }

  private isRunningStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  private isDismissed(): boolean {
    try {
      const raw = localStorage.getItem(PwaInstallService.STORAGE_KEYS.dismissed);
      if (!raw) return false;

      const dismissedAt = Number(raw);
      if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return true;

      const isStillDismissed = Date.now() - dismissedAt < PwaInstallService.DISMISS_TTL_MS;
      if (!isStillDismissed) {
        localStorage.removeItem(PwaInstallService.STORAGE_KEYS.dismissed);
      }
      return isStillDismissed;
    } catch {
      return false;
    }
  }

  private markDismissed(): void {
    try {
      localStorage.setItem(PwaInstallService.STORAGE_KEYS.dismissed, String(Date.now()));
    } catch {
      // ignore (private mode / blocked storage)
    }
  }

  private clearDismissed(): void {
    try {
      localStorage.removeItem(PwaInstallService.STORAGE_KEYS.dismissed);
    } catch {
      // ignore
    }
  }
}
