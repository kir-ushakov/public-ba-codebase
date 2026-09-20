import { Component, OnInit } from '@angular/core';
import { Store, createSelectMap } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { HomeBottomPanelComponent } from './home-bottom-panel/home-bottom-panel.component';
import { HomeAccountMenuComponent } from './home-account-menu/home-account-menu.component';
import { HomeSyncStatusComponent } from './home-sync-status/home-sync-status.component';
import { TaskTilesPanelComponent } from '../../common/task-tiles-panel/task-tiles-panel.component';

@Component({
  selector: 'ba-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.scss'],
  imports: [
    HomeAccountMenuComponent,
    HomeBottomPanelComponent,
    HomeSyncStatusComponent,
    TaskTilesPanelComponent,
  ],
})
export class HomeScreenComponent implements OnInit {
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
