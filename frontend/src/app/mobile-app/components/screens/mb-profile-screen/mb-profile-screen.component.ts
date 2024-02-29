import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserState } from 'src/app/shared/state/user.state';
import { ProfileScreenAction } from './mb-profile-screen.action';
import { ActivatedRoute } from '@angular/router';
import { EOkFailedStatus } from 'src/app/shared/enums/ok-failed-status.enum';

@Component({
  selector: 'app-profile-screen',
  templateUrl: './mb-profile-screen.component.html',
  styleUrls: ['./mb-profile-screen.component.scss'],
})
export class MbProfileScreenComponent {
  @Select(UserState.userName) userName$: Observable<string>;
  @Select(UserState.userEmail) userEmail$: Observable<string>;
  @Select(UserState.loggedIn) loggedIn$: Observable<boolean>;

  avatarInputData = {};

  constructor(private _store: Store, private _route: ActivatedRoute) {}

  ngOnInit() {
    this.setAvatarInputData();
  }

  logout() {
    this._store.dispatch(ProfileScreenAction.Logout);
  }

  editAvatar() {
    // TODO
  }

  private setAvatarInputData() {
    const userNameFirstLetter = this._store.selectSnapshot(
      UserState.userNameFirstLetter
    );

    this.avatarInputData = {
      firstLetter: userNameFirstLetter,
      color: '#D353D9', // temporarily - will need to use from settings
    };
  }
}
