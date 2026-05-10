import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { Store } from '@ngxs/store';
import { Observable, fromEvent, of, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceDetectorService } from 'src/app/shared/services/device-detector/device-detector.service';
import { AppAction } from './shared/state/app.actions';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Router, RouterOutlet } from '@angular/router';
import { mobileRoutes } from './mobile-app/mobile-app.routing';
import { desktopRoutes } from './desktop-app/desktop-app.routing';
import { PwaInstallService } from './shared/services/pwa/pwa-install.service';
import { DialogService } from './shared/services/utility/dialog.service';
import { PwaInstallDialogComponent } from './shared/components/ui-elements/pwa-install-dialog/pwa-install-dialog.component';
import { PwaVersionUpdateService } from './shared/services/pwa/pwa-version-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  onlineEvent: Observable<Event>;
  offlineEvent: Observable<Event>;
  online$: Observable<boolean>;
  private pwaInstallDialogOpen = false;
  private appUrlOpen?: PluginListenerHandle;

  constructor(
    private readonly _router: Router,
    private readonly _store: Store,
    private readonly _deviceDetectorService: DeviceDetectorService,
    private readonly pwaInstallService: PwaInstallService,
    private readonly dialogService: DialogService,
    private readonly pwaVersionUpdateService: PwaVersionUpdateService,
    private readonly _zone: NgZone,
  ) {
    defineCustomElements(window);
  }

  ngOnInit(): void {
    // TODO: Remove desktop logic
    // TICKET: https://brainas.atlassian.net/browse/BA-239
    //this.attachModuleDependOnDevice();
    this.setOnOffLineHandlers();
    // Listen for PWA install prompt availability and show dialog automatically
    void this.initNativeDeepLinks();
    this.pwaInstallService.installPromptAvailable.subscribe(isAvailable => {
      if (isAvailable && !this.pwaInstallDialogOpen && this.pwaInstallService.shouldShowInstallDialog()) {
        console.log('PWA install prompt is available, opening dialog');
        this.pwaInstallService.markDialogShownThisSession();
        this.pwaInstallDialogOpen = true;
        const dialogRef = this.dialogService.showModalDialog(PwaInstallDialogComponent);
        dialogRef.afterClosed().subscribe(result => {
          this.pwaInstallDialogOpen = false;
          if (result !== true) {
            this.pwaInstallService.dismissInstallDialog();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    void this.appUrlOpen?.remove();
  }

  private async initNativeDeepLinks(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    this.appUrlOpen = await App.addListener('appUrlOpen', ({ url }) =>
      this._zone.run(() => this.navigateFromExternalUrl(url)),
    );
    try {
      const { url } = await App.getLaunchUrl();
      if (url != null && url !== '') {
        this._zone.run(() => this.navigateFromExternalUrl(url));
      }
    } catch {
      /* no cold-start URL */
    }
  }

  /**
   * Maps App Links / custom-scheme URLs into Angular routes (path + query).
   */
  private navigateFromExternalUrl(urlString: string): void {
    let pathWithQuery = '/';
    try {
      const url = new URL(urlString);
      pathWithQuery = `${url.pathname || '/'}${url.search}`;
      if (!pathWithQuery.startsWith('/')) {
        pathWithQuery = `/${pathWithQuery}`;
      }
    } catch {
      return;
    }
    void this._router.navigateByUrl(pathWithQuery, { replaceUrl: true }).catch(() => undefined);
  }

  private setOnOffLineHandlers() {
    this.online$ = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    );

    this.online$.subscribe(isOnline => {
      if (isOnline) {
        this._store.dispatch(new AppAction.Online());
      } else {
        this._store.dispatch(new AppAction.Offline());
      }
    });
  }

  // TODO: Remove desctop logic
  // TICKET: https://brainas.atlassian.net/browse/BA-239
  private attachModuleDependOnDevice() {
    const isMobile = this._deviceDetectorService.isMobile();
    this._router.resetConfig(isMobile ? mobileRoutes : desktopRoutes);
  }
}
