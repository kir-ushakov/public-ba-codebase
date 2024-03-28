import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { Observable } from 'rxjs';
import { Task } from 'src/app/shared/models/task.model';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppState } from 'src/app/shared/state/app.state';
import { IUserAvatarInputData } from 'src/app/shared/components/common/user-avatar/user-avatar.interface';

@Component({
  selector: 'ba-home-screen',
  templateUrl: './mb-home-screen.component.html',
  styleUrls: ['./mb-home-screen.component.scss'],
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
