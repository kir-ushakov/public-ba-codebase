import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { DeviceDetectorService } from 'src/app/shared/serivces/device-detector/device-detector.service';

const desktopRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./desktop-app/desktop-app.module').then(
        (m) => m.DesktopAppModule
      ),
  },
];
const mobileRouters: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./mobile-app/mobile-app.module').then((m) => m.MobileAppModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(desktopRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
  constructor(
    private router: Router,
    private deviceDetector: DeviceDetectorService
  ) {
    if (this.deviceDetector.isMobile()) {
      this.router.resetConfig(mobileRouters);
    }
  }
}
