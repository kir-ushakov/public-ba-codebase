import {
  enableProdMode,
  importProvidersFrom,
  inject,
  isDevMode,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideStates, provideStore, Store } from '@ngxs/store';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { firstValueFrom } from 'rxjs';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { mobileRoutes } from './app/mobile-app/mobile-app.routing';
import { AppState } from './app/shared/state/app.state';
import { UserState } from './app/shared/state/user.state';
import { SyncState } from './app/shared/state/sync.state';
import { TagsState } from './app/shared/state/tags.state';
import { TasksState } from './app/shared/state/tasks.state';
import { HttpInterceptorService } from './app/shared/services/infrastructure/http-interceptor.service';
import { LocalSessionService } from './app/shared/services/infrastructure/local-session.service';
import { PwaVersionUpdateService } from './app/shared/services/pwa/pwa-version-update.service';
import { AppAction } from './app/shared/state/app.actions';
import { SyncAction } from './app/shared/state/sync.action';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideStore(
      [],
      withNgxsStoragePlugin({
        keys: ['user'],
      }),
    ),
    provideStates([AppState, UserState, SyncState, TasksState, TagsState]),
    provideAppInitializer(() => {
      const store = inject(Store);
      const session = inject(LocalSessionService);
      const userId = store.selectSnapshot(UserState.userId);
      if (!userId) {
        return Promise.resolve();
      }
      return session
        .openAndLoad(userId)
        .then(snapshot =>
          firstValueFrom(store.dispatch(new SyncAction.LocalDataHydrated(snapshot))),
        )
        .catch(() => {
          store.dispatch(
            new AppAction.ShowErrorInUI('Could not open saved tasks on this device.', 'Not saved'),
          );
        });
    }),
    provideNoopAnimations(),
    provideRouter(mobileRoutes),
    importProvidersFrom(
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
      }),
    ),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
    PwaVersionUpdateService,
  ],
}).catch(err => console.error(err));
