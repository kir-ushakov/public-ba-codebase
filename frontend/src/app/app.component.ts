import { Component } from '@angular/core';
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
export class AppComponent {
  onlineEvent: Observable<Event>;
  offlineEvent: Observable<Event>;
  online$: Observable<boolean>;

  constructor(
    private readonly _router: Router,
    private readonly _store: Store,
    private readonly _deviceDetectorService: DeviceDetectorService,
    private readonly pwaInstallService: PwaInstallService,
    private readonly dialogService: DialogService,
    private readonly pwaVersionUpdateService: PwaVersionUpdateService,
  ) {
    defineCustomElements(window);
  }

  ngOnInit(): void {
    this.attachModuleDependOnDevice();
    this.setOnOffLineHandlers();
    // Listen for PWA install prompt availability and show dialog automatically
    this.pwaInstallService.installPromptAvailable.subscribe(isAvailable => {
      if (isAvailable) {
        console.log('PWA install prompt is available, opening dialog');
        this.dialogService.showModalDialog(PwaInstallDialogComponent);
      }
    });
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

  private attachModuleDependOnDevice() {
    const isMobile = this._deviceDetectorService.isMobile();
    this._router.resetConfig(isMobile ? mobileRoutes : desktopRoutes);
  }
}
