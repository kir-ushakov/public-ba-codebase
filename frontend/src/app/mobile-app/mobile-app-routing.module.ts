import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '../shared/serivces/auth/auth-guard.service';

import { MbHomeScreenComponent } from './components/screens/mb-home-screen/mb-home-screen.component';
import { MbTaskScreenComponent } from './components/screens/mb-task-screen/mb-task-screen.component';
import { MbLoginScreenComponent } from './components/screens/mb-login-screen/mb-login-screen.component';
import { MbSignupScreenComponent } from './components/screens/mb-signup-screen/mb-signup-screen.component';
import { MbProfileScreenComponent } from './components/screens/mb-profile-screen/mb-profile-screen.component';
import { MbSyncScreenComponent } from './components/screens/mb-sync-screen/mb-sync-screen.component';
import { AddToSlackRedirectComponent } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: MbHomeScreenComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'profile',
        component: MbProfileScreenComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'task/:mode',
        component: MbTaskScreenComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'task/:mode/:id',
        component: MbTaskScreenComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sync',
        component: MbSyncScreenComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'integrations/slack/install',
        component: AddToSlackRedirectComponent,
        canActivate: [AuthGuardService],
      },
    ],
  },
  { path: 'login', component: MbLoginScreenComponent },
  { path: 'signup', component: MbSignupScreenComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MobielAppRoutingModule {}
