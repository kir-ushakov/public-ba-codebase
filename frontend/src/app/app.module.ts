import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxsModule } from '@ngxs/store';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AppState } from './shared/state/app.state';
import { UserState } from './shared/state/user.state';
import { SyncState } from './shared/state/sync.state';
import { TasksState } from './shared/state/tasks.state';
import { AuthGuardService } from './shared/serivces/auth/auth-guard.service';
import { HttpInterceptorService } from './shared/serivces/infrastructure/http-interceptor.service';
import { NgxsFormPluginModule } from '@ngxs/form-plugin';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // NGXS
    NgxsModule.forRoot([AppState, UserState, SyncState, TasksState]),
    NgxsStoragePluginModule.forRoot(),
    NgxsFormPluginModule.forRoot(),
  ],
  providers: [
    AuthGuardService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
