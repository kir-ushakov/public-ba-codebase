import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { Observable } from 'rxjs';
import { Task } from 'src/app/shared/models/task.model';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppState } from 'src/app/shared/state/app.state';
import { IUserAvatarInputData } from 'src/app/shared/components/common/user-avatar/user-avatar.interface';
import { MbHomeBottomPanelComponent } from './mb-home-bottom-panel/mb-home-bottom-panel.component';
import { UserAvatarComponent } from 'src/app/shared/components/common/user-avatar/user-avatar.component';
import { CommonModule } from '@angular/common';
import { TaskTilesPanelComponent } from '../../common/task-tiles-panel/task-tiles-panel.component';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'ba-home-screen',
    templateUrl: './mb-home-screen.component.html',
    styleUrls: ['./mb-home-screen.component.scss'],
    imports: [ 
      CommonModule,
      RouterModule,
      UserAvatarComponent, 
      MbHomeBottomPanelComponent, 
      TaskTilesPanelComponent
    ]
})
export class MbHomeScreenComponent implements OnInit {
  @Select(TasksState.actualTasks) tasks$: Observable<Task[]>;
  @Select(UserState.isLoggedIn) isLoggedIn$: Observable<boolean>;
  @Select(UserState.isLocalAuthenticated)
  isLocalAuthenticated$: Observable<boolean>;
  @Select(AppState.online) online$: Observable<boolean>;

  avatarInputData: IUserAvatarInputData;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(AppAction.Opened);
    this.setAvatarInputData();
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
