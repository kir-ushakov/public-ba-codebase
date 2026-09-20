import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  AuthService,
  SignUpRequestDTO,
  SignUpResponseDTO,
} from 'src/app/shared/services/api/auth.service';
import { SignupScreenAction } from './signup-screen.actions';
import { EMPTY, catchError, tap } from 'rxjs';
import { AppAction } from 'src/app/shared/state/app.actions';

export interface ISignupScreenStateModel {
  signUpResult: SignUpResponseDTO | null;
}

@State<ISignupScreenStateModel>({
  name: 'signupScreenState',
  defaults: {
    signUpResult: null,
  },
})
@Injectable()
export class SignupScreenState {
  constructor(private authService: AuthService) {}

  @Selector()
  static signUpResult(state: ISignupScreenStateModel): SignUpResponseDTO | null {
    return state.signUpResult;
  }

  @Action(SignupScreenAction.SignupUser)
  signup(ctx: StateContext<ISignupScreenStateModel>, { dto }: { dto: SignUpRequestDTO }) {
    this.authService
      .signUp(dto)
      .pipe(
        tap(res => {
          ctx.patchState({
            signUpResult: res,
          });
        }),
        catchError(err => {
          // TODO: Need to handle error here
          console.log(err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  @Action(SignupScreenAction.Closed)
  closed(ctx: StateContext<ISignupScreenStateModel>) {
    ctx.patchState({
      signUpResult: null,
    });
    ctx.dispatch(AppAction.NavigateToLoginScreen);
  }
}
