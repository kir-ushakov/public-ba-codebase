import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideStates, provideStore } from '@ngxs/store';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { mobileRoutes } from './app/mobile-app/mobile-app.routing';
import { AppState } from './app/shared/state/app.state';
import { UserState } from './app/shared/state/user.state';
import { SyncState } from './app/shared/state/sync.state';
import { TasksState } from './app/shared/state/tasks.state';
import { HttpInterceptorService } from './app/shared/services/infrastructure/http-interceptor.service';




if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideStore(
      [],
      withNgxsStoragePlugin({
        keys: '*'
      })
    ),
    provideStates([ 
      AppState,        
      UserState, 
      SyncState, 
      TasksState,
    ]),
    provideHttpClient(),
    provideNoopAnimations(),
    provideRouter(mobileRoutes),
    importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    }
  ]
}).catch((err) => console.error(err));
