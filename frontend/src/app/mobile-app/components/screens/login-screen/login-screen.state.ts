import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { LoginScreenAction } from './login-screen.actions';
import { UserAction } from 'src/app/shared/state/user.actions';

interface ILoginScreenStateModel {
  authErrMessage: string | null;
  submitting: boolean;
}

@State<ILoginScreenStateModel>({
  name: 'loginScreenState',
  defaults: { authErrMessage: null, submitting: false },
})
@Injectable()
export class LoginScreenState {
  @Selector()
  static authError(state: ILoginScreenStateModel): string | null {
    return state.authErrMessage;
  }

  @Selector()
  static submitting(state: ILoginScreenStateModel): boolean {
    return state.submitting === true;
  }

  @Action(UserAction.AuthFailed)
  authFailed(ctx: StateContext<ILoginScreenStateModel>, { message }: UserAction.AuthFailed): void {
    ctx.patchState({
      authErrMessage: message,
      submitting: false,
    });
  }

  @Action(LoginScreenAction.Opened)
  screenOpened(ctx: StateContext<ILoginScreenStateModel>): void {
    ctx.patchState({
      authErrMessage: null,
      submitting: false,
    });
  }

  @Action(LoginScreenAction.FieldValuesChanged)
  removeErrMessage(ctx: StateContext<ILoginScreenStateModel>): void {
    ctx.patchState({
      authErrMessage: null,
    });
  }

  @Action(LoginScreenAction.LoginUser)
  beginSubmit(ctx: StateContext<ILoginScreenStateModel>): void {
    ctx.patchState({
      authErrMessage: null,
      submitting: true,
    });
  }

  @Action(LoginScreenAction.LoginSettled)
  @Action(UserAction.UserLoggedInWithPassword)
  finishSubmit(ctx: StateContext<ILoginScreenStateModel>): void {
    ctx.patchState({
      submitting: false,
    });
  }
}
