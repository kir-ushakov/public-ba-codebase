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
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installPromptAvailable$ = new BehaviorSubject<boolean>(false);
  private isPWAInstalled$ = new BehaviorSubject<boolean>(false);

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

  public isInstallPromptAvailable(): boolean {
    return this.deferredPrompt !== null;
  }

  private setupPWAInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;

      // Notify that install prompt is available
      this.installPromptAvailable$.next(true);
      console.log('PWA install prompt available');
    });
  }

  private checkIfPWAInstalled(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isPWAInstalled$.next(true);
      console.log('PWA is already installed and running in standalone mode');
    }
  }
}
