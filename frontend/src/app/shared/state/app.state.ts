import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { AppAction } from '../../app.actions';

export interface AppStateModel {
  isOnline: boolean;
}

@State<AppStateModel>({
  name: 'app',
  defaults: {
    isOnline: false,
  },
})
@Injectable()
export class AppState {
  @Selector()
  static isOnline(state: AppStateModel): boolean {
    return state.isOnline;
  }

  @Action(AppAction.Opened)
  appOpened(ctx: StateContext<AppStateModel>) {
    // TODO: here need to perform operations on App Opened Event
  }

  @Action(AppAction.Online)
  online(ctx: StateContext<AppStateModel>) {
    ctx.patchState({ isOnline: true });
  }

  @Action(AppAction.Offline)
  offline(ctx: StateContext<AppStateModel>) {
    ctx.patchState({ isOnline: false });
  }
}
