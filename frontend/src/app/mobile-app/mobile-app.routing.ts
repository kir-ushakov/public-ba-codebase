import { Routes } from '@angular/router';
import { AuthGuardService } from '../shared/services/auth/auth-guard.service';
import { HomeScreenComponent } from './components/screens/home-screen/home-screen.component';
import { TaskScreenComponent } from './components/screens/task-screen/task-screen.component';
import { LoginScreenComponent } from './components/screens/login-screen/login-screen.component';
import { SignupScreenComponent } from './components/screens/signup-screen/signup-screen.component';
import { ProfileScreenComponent } from './components/screens/profile-screen/profile-screen.component';
import { SyncScreenComponent } from './components/screens/sync-screen/sync-screen.component';
import { AddToSlackRedirectComponent } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.component';
import { GoogleAuthRedirectScreenComponent } from '../shared/components/redirects/google/google-auth-redirect/google-auth-redirect.component';
import { MobileAppComponent } from './mobile-app.component';
import { provideStates } from '@ngxs/store';
import { MobileAppState } from './mobile-app.state';
import { LoginScreenState } from './components/screens/login-screen/login-screen.state';
import { GoogleAuthRedirectScreenState } from '../shared/components/redirects/google/google-auth-redirect/google-auth-redirect.state';
import { TaskScreenState } from './components/screens/task-screen/task-screen.state';
import { VoiceInputState } from '../shared/features/voice-input/state/voice-input.state';
import { SignupScreenState } from './components/screens/signup-screen/signup-screen.state';
import { AddToSlackRedirectScreenState } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.state';

export const mobileRoutes: Routes = [
  {
    path: '',
    component: MobileAppComponent,
    providers: [provideStates([MobileAppState])],
    canActivateChild: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: HomeScreenComponent,
      },
      {
        path: 'profile',
        component: ProfileScreenComponent,
      },
      {
        path: 'task/:mode',
        component: TaskScreenComponent,
        providers: [provideStates([TaskScreenState, VoiceInputState])],
      },
      {
        path: 'task/:mode/:id',
        component: TaskScreenComponent,
        providers: [provideStates([TaskScreenState, VoiceInputState])],
      },
      {
        path: 'sync',
        component: SyncScreenComponent,
      },
      {
        path: 'integrations/slack/install',
        component: AddToSlackRedirectComponent,
        providers: [provideStates([AddToSlackRedirectScreenState])],
      },
    ],
  },
  {
    path: 'login',
    component: LoginScreenComponent,
    providers: [provideStates([LoginScreenState])],
  },
  {
    path: 'signup',
    component: SignupScreenComponent,
    providers: [provideStates([SignupScreenState])],
  },
  {
    path: 'google/oauth2callback',
    component: GoogleAuthRedirectScreenComponent,
    providers: [provideStates([GoogleAuthRedirectScreenState])],
  },
];
