import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserState } from 'src/app/shared/state/user.state';
import { MbProfileScreenAction } from './mb-profile-screen.actions';

@Component({
  selector: 'app-profile-screen',
  templateUrl: './mb-profile-screen.component.html',
  styleUrls: ['./mb-profile-screen.component.scss'],
})
export class MbProfileScreenComponent {
  @Select(UserState.userFullName) userFullName$: Observable<string>;
  @Select(UserState.userEmail) userEmail$: Observable<string>;
  @Select(UserState.isLoggedIn) isLoggedIn$: Observable<boolean>;

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
