import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, fromEvent, of, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceDetectorService } from 'src/app/shared/services/device-detector/device-detector.service';
import { AppAction } from './app.actions';
import { preloadImages } from './shared/helpers/preload-images.function';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  onlineEvent: Observable<Event>;
  offlineEvent: Observable<Event>;
  online$: Observable<boolean>;

  constructor(
    public deviceDetector: DeviceDetectorService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.setOnOffLineHandlers();
    preloadImages();
  }

  private setOnOffLineHandlers() {
    this.online$ = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    );

    this.online$.subscribe((isOnline) => {
      if (isOnline) {
        this.store.dispatch(new AppAction.Online());
      } else {
        this.store.dispatch(new AppAction.Offline());
      }
    });
  }
}
