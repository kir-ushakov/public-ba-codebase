import { State, Action, StateContext } from '@ngxs/store';
import { Router } from '@angular/router';
import { MbHomeBottomPanelAction } from './components/screens/mb-home-screen/mb-home-bottom-panel/mb-home-bottom-panel.actions';
import { Injectable, NgZone } from '@angular/core';
import { MbTaskScreenAction } from './components/screens/mb-task-screen/mb-task-screen.actions';
import { MbTaskTileAction } from './components/common/task-tiles-panel/task-tile/task-tile.actions';
import { ETaskViewMode } from './components/screens/mb-task-screen/mb-task-screen.state';
import { AppAction } from '../shared/state/app.actions';

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

  @Action(MbHomeBottomPanelAction.CreateTask)
  openCreateTaskView() {
    this.ngZone.run(() => {
      this.router.navigate(['task/' + ETaskViewMode.Create]);
    });
  }

  @Action(MbTaskTileAction.Clicked)
  openTaskView(ctx: StateContext<MobileAppStateModel>, { taskId }) {
    this.ngZone.run(() => {
      this.router.navigate([`task/${ETaskViewMode.View}/${taskId}`]);
    });
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
