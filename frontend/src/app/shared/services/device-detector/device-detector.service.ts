import { Injectable } from '@angular/core';
import { WindowRefService } from 'src/app/shared/services/utility/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceDetectorService {
  static readonly MOBILE_DEVICE_SIZE = 768;

  constructor(private windowRef: WindowRefService) {}

  public isMobile(): boolean {
    return this.windowRef.nativeWindow.innerWidth <= DeviceDetectorService.MOBILE_DEVICE_SIZE;
  }

  public isDesktop(): boolean {
    return this.windowRef.nativeWindow.innerWidth > DeviceDetectorService.MOBILE_DEVICE_SIZE;
  }
}
