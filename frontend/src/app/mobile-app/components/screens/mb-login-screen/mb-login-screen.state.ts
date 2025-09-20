import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { MbLoginScreenAction } from './mb-login-screen.actions';
import { UserAction } from 'src/app/shared/state/user.actions';

interface IMbLoginScreenStateModel {
  authErrMessage: string;
}

@State<IMbLoginScreenStateModel>({
  name: 'mbLoginScreenState',
  defaults: { authErrMessage: null },
})
@Injectable()
export class MbLoginScreenState {
  @Selector()
  static authError(state: IMbLoginScreenStateModel): string {
    return state.authErrMessage;
  }

  @Action(UserAction.AuthFailed)
  authFailed(ctx: StateContext<IMbLoginScreenStateModel>, { message }) {
    ctx.patchState({
      authErrMessage: message,
    });
  }

  @Action(MbLoginScreenAction.Opened)
  @Action(MbLoginScreenAction.FieldValuesChanged)
  removeErrMessage(ctx: StateContext<IMbLoginScreenStateModel>) {
    ctx.patchState({
      authErrMessage: null,
    });
  }
}
