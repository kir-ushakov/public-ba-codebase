import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { AppAction } from './app.actions';

export interface AppStateModel {
  online: boolean;
}

@State<AppStateModel>({
  name: 'app',
  defaults: {
    online: false,
  },
})
@Injectable()
export class AppState {
  @Selector()
  static online(state: AppStateModel): boolean {
    return state.online;
  }

  @Action(AppAction.Opened)
  appOpened(ctx: StateContext<AppStateModel>) {
    // @TODO#FUNCTIONALITY - here need to perform operations on App opening
  }

  @Action(AppAction.Online)
  online(ctx: StateContext<AppStateModel>) {
    console.log('{ online: true }');
    ctx.patchState({ online: true });
  }

  @Action(AppAction.Offline)
  offline(ctx: StateContext<AppStateModel>) {
    ctx.patchState({ online: false });
  }

  @Action(AppAction.ShowErrorInUI)
  showErrorInUI(ctx: StateContext<AppStateModel>) {
    debugger;
    console.log('TODO: Show error in UI');
  }
}
