import { Routes } from '@angular/router';
import { AuthGuardService } from '../shared/services/auth/auth-guard.service';
import { MbHomeScreenComponent } from './components/screens/mb-home-screen/mb-home-screen.component';
import { MbTaskScreenComponent } from './components/screens/mb-task-screen/mb-task-screen.component';
import { MbLoginScreenComponent } from './components/screens/mb-login-screen/mb-login-screen.component';
import { MbSignupScreenComponent } from './components/screens/mb-signup-screen/mb-signup-screen.component';
import { MbProfileScreenComponent } from './components/screens/mb-profile-screen/mb-profile-screen.component';
import { MbSyncScreenComponent } from './components/screens/mb-sync-screen/mb-sync-screen.component';
import { AddToSlackRedirectComponent } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.component';
import { GoogleAuthRedirectScreenComponent } from '../shared/components/redirects/google/google-auth-redirect/google-auth-redirect.component';
import { MobileAppComponent } from './mobile-app.components';
import { provideStates } from '@ngxs/store';
import { MobileAppState } from './mobile-app.state';
import { MbLoginScreenState } from './components/screens/mb-login-screen/mb-login-screen.state';
import { GoogleAuthRedirectScreenState } from '../shared/components/redirects/google/google-auth-redirect/google-auth-redirect.state';
import { MbTaskScreenState } from './components/screens/mb-task-screen/mb-task-screen.state';
import { MbSignupScreenState } from './components/screens/mb-signup-screen/mb-signup-screen.state';
import { AddToSlackRedirectScreenState } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.state';

export const mobileRoutes: Routes = [
  {
    path: '',
    component: MobileAppComponent,
    providers: [
      provideStates([
        MobileAppState
      ])
    ],
    canActivateChild: [ AuthGuardService ],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: MbHomeScreenComponent,
      },
      {
        path: 'profile',
        component: MbProfileScreenComponent,
      },
      {
        path: 'task/:mode',
        component: MbTaskScreenComponent,
        providers: [ provideStates([ MbTaskScreenState] ) ]
      },
      {
        path: 'task/:mode/:id',
        component: MbTaskScreenComponent,
        providers: [ provideStates([ MbTaskScreenState] ) ]
      },
      {
        path: 'sync',
        component: MbSyncScreenComponent,
      },
      {
        path: 'integrations/slack/install',
        component: AddToSlackRedirectComponent,
        providers: [ provideStates([ AddToSlackRedirectScreenState]) ]
      },
    ],
  },
  { path: 'login', component: MbLoginScreenComponent, providers: [ provideStates([ MbLoginScreenState ]) ] },
  { path: 'signup', component: MbSignupScreenComponent, providers: [ provideStates([ MbSignupScreenState ]) ] },
  {
    path: 'google/oauth2callback',
    component: GoogleAuthRedirectScreenComponent,
    providers: [ provideStates([GoogleAuthRedirectScreenState]) ]
  },
];
