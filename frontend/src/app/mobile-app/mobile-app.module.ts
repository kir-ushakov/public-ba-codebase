import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { MobielAppRoutingModule } from './mobile-app-routing.module';
import { MbHomeScreenComponent } from './components/screens/mb-home-screen/mb-home-screen.component';
import { MbHomeBottomPanelComponent } from './components/screens/mb-home-screen/mb-home-bottom-panel/mb-home-bottom-panel.component';
import { NgxsModule } from '@ngxs/store';
import { MobileAppState } from './mobile-app.state';
import { MbTaskViewState } from './components/screens/mb-task-screen/mb-task-screen.state';
import { MbTaskScreenComponent } from './components/screens/mb-task-screen/mb-task-screen.component';
import { MbLoginScreenComponent } from './components/screens/mb-login-screen/mb-login-screen.component';
import { MbSignupScreenComponent } from './components/screens/mb-signup-screen/mb-signup-screen.component';
import { LoginScreenState } from './components/screens/mb-login-screen/mb-login-screen.state';
import { MbProfileScreenComponent } from './components/screens/mb-profile-screen/mb-profile-screen.component';
import { MbSyncScreenComponent } from './components/screens/mb-sync-screen/mb-sync-screen.component';
import { MbTaskViewBottomComponent } from './components/screens/mb-task-screen/mb-task-view-bottom/mb-task-view-bottom.component';
import { NgxsFormPluginModule } from '@ngxs/form-plugin';
import { AddToSlackBtnComponent } from './components/screens/mb-profile-screen/add-to-slack-btn/add-to-slack-btn.component';
import { AddToSlackRedirectComponent } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.component';
import { AddToSlackRedirectScreenState } from '../shared/components/redirects/slack/add-to-slack-redirect/add-to-slack-redirect.state';
import { TaskTileComponent } from './components/common/task-tiles-panel/task-tile/task-tile.component';
import { TaskTilesPanelComponent } from './components/common/task-tiles-panel/task-tiles-panel.component';

@NgModule({
  imports: [
    SharedModule,
    MobielAppRoutingModule,
    NgxsModule.forFeature([
      MobileAppState,
      MbTaskViewState,
      LoginScreenState,
      AddToSlackRedirectScreenState,
    ]),
    NgxsFormPluginModule,
  ],
  declarations: [
    MbHomeScreenComponent,
    MbHomeBottomPanelComponent,
    MbTaskScreenComponent,
    MbLoginScreenComponent,
    MbSignupScreenComponent,
    MbProfileScreenComponent,
    MbSyncScreenComponent,
    MbTaskViewBottomComponent,
    AddToSlackBtnComponent,
    AddToSlackRedirectComponent,
    TaskTileComponent,
    TaskTilesPanelComponent,
  ],
})
export class MobileAppModule {}
