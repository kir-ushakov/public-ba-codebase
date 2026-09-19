import { State, Action, StateContext } from '@ngxs/store';
import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { MbTaskScreenAction } from './components/screens/mb-task-screen/mb-task-screen.actions';
import { MbTaskTileAction } from './components/common/task-tiles-panel/task-tile/task-tile.actions';
import { AppAction } from '../shared/state/app.actions';
import { TasksAction } from '../shared/state/tasks.action';

// TODO: For this moment this interface is empty
// sorry lint :(
// eslint-disable-next-line
export interface MobileAppStateModel {}

@State<MobileAppStateModel>({
  name: 'mobileApp',
  defaults: {},
})
@Injectable()
export class MobileAppState {
  constructor(
    private router: Router,
    private ngZone: NgZone,
  ) {}

  @Action(MbTaskTileAction.DeleteSelected)
  deleteTask(ctx: StateContext<MobileAppStateModel>, { taskId }: MbTaskTileAction.DeleteSelected) {
    return ctx.dispatch(new TasksAction.DeleteTask(taskId));
  }

  @Action(MbTaskScreenAction.Close)
  @Action(AppAction.NavigateToHomeScreen)
  openHomeView() {
    this.ngZone.run(() => {
      this.router.navigate(['/']);
    });
  }

  @Action(AppAction.NavigateToLoginScreen)
  navigateToLoginScreen() {
    this.ngZone.run(() => {
      this.router.navigate(['login']);
    });
  }

  @Action(AppAction.NavigateToSingUpScreen)
  navigateToSingUpScreen() {
    this.ngZone.run(() => {
      this.router.navigate(['signup']);
    });
  }

  @Action(AppAction.NavigateToProfileScreen)
  navigateToProfileScreen() {
    this.ngZone.run(() => {
      this.router.navigate(['profile']);
    });
  }
}
