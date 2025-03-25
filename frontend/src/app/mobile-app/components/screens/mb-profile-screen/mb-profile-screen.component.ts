import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { createSelectMap, Store } from '@ngxs/store';
import { UserState } from 'src/app/shared/state/user.state';
import { MbProfileScreenAction } from './mb-profile-screen.actions';
import { UserAvatarComponent } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.component';
import { MbIntegrationsComponent } from './integrations/mb-integrations.component';
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-profile-screen',
    templateUrl: './mb-profile-screen.component.html',
    styleUrls: ['./mb-profile-screen.component.scss'],
    imports: [ 
      CommonModule,
      RouterModule, 
      MatIconModule,
      UserAvatarComponent,
      MbIntegrationsComponent,
    ]
})
export class MbProfileScreenComponent {
  selectors = createSelectMap({
    userFullName: UserState.userFullName,
    userEmail: UserState.userEmail,
    isLoggedIn: UserState.isLoggedIn
  })

  avatarInputData = {};

  constructor(private store: Store) {}

  ngOnInit() {
    this.setAvatarInputData();
  }

  logout() {
    this.store.dispatch(MbProfileScreenAction.Logout);
  }

  editAvatar() {
    // TODO
  }

  private setAvatarInputData() {
    const userNameFirstLetter = this.store.selectSnapshot(
      UserState.userNameFirstLetter
    );

    this.avatarInputData = {
      firstLetter: userNameFirstLetter,
      color: '#D353D9', // temporarily - will need to use from settings
    };
  }
}
