import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { LoginScreenAction } from './login-screen.actions';
import { UserAction } from 'src/app/shared/state/user.actions';

interface ILoginScreenStateModel {
  authErrMessage: string | null;
}

@State<ILoginScreenStateModel>({
  name: 'loginScreenState',
  defaults: { authErrMessage: null },
})
@Injectable()
export class LoginScreenState {
  @Selector()
  static authError(state: ILoginScreenStateModel): string | null {
    return state.authErrMessage;
  }

  @Action(UserAction.AuthFailed)
  authFailed(ctx: StateContext<ILoginScreenStateModel>, { message }: UserAction.AuthFailed) {
    ctx.patchState({
      authErrMessage: message,
    });
  }

  @Action(LoginScreenAction.Opened)
  @Action(LoginScreenAction.FieldValuesChanged)
  removeErrMessage(ctx: StateContext<ILoginScreenStateModel>) {
    ctx.patchState({
      authErrMessage: null,
    });
  }
}
