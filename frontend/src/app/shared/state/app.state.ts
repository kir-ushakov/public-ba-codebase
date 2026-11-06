import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { AppAction } from './app.actions';
import { UserAction } from './user.actions';

export type AppUiError = {
  title: string;
  body: string;
};

export interface AppStateModel {
  online: boolean;
  uiError: AppUiError | null;
}

@State<AppStateModel>({
  name: 'app',
  defaults: {
    online: false,
    uiError: null,
  },
})
@Injectable()
export class AppState {
  @Selector()
  static online(state: AppStateModel): boolean {
    return state.online;
  }

  @Selector()
  static uiError(state: AppStateModel): AppUiError | null {
    return state.uiError;
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
  showErrorInUI(ctx: StateContext<AppStateModel>, action: AppAction.ShowErrorInUI): void {
    ctx.patchState({
      uiError: action.title
        ? { title: action.title, body: action.message }
        : { title: action.message, body: '' },
    });
  }

  @Action(AppAction.ClearErrorInUI)
  @Action(UserAction.LoggedOut)
  clearErrorInUI(ctx: StateContext<AppStateModel>): void {
    ctx.patchState({ uiError: null });
  }
}
