import { Component, OnInit } from '@angular/core';
import { Store, createSelectMap } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { MbHomeBottomPanelComponent } from './mb-home-bottom-panel/mb-home-bottom-panel.component';
import { MbHomeAccountMenuComponent } from './mb-home-account-menu/mb-home-account-menu.component';
import { MbHomeSyncStatusComponent } from './mb-home-sync-status/mb-home-sync-status.component';
import { TaskTilesPanelComponent } from '../../common/task-tiles-panel/task-tiles-panel.component';

@Component({
  selector: 'ba-home-screen',
  templateUrl: './mb-home-screen.component.html',
  styleUrls: ['./mb-home-screen.component.scss'],
  imports: [
    MbHomeAccountMenuComponent,
    MbHomeBottomPanelComponent,
    MbHomeSyncStatusComponent,
    TaskTilesPanelComponent,
  ],
})
export class MbHomeScreenComponent implements OnInit {
  selectors = createSelectMap({
    tasks: TasksState.actualTasks,
    isLoggedIn: UserState.isLoggedIn,
    isLocalAuthenticated: UserState.isLocalAuthenticated,
    userFullName: UserState.userFullName,
    userEmail: UserState.userEmail,
  });

  avatarInputData!: IUserAvatarInputData;

  get itemCountLabel(): string {
    return `${this.selectors.tasks().length} items`;
  }

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(AppAction.Opened);
    this.setAvatarInputData();
  }

  private setAvatarInputData(): void {
    const userNameFirstLetter = this.store.selectSnapshot(UserState.userNameFirstLetter);

    this.avatarInputData = {
      firstLetter: userNameFirstLetter,
    };
  }
}
