import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  AuthService,
  SignUpRequestDTO,
  SignUpResponseDTO,
} from 'src/app/shared/services/api/auth.service';
import { MbSignupScreenAction } from './mb-signup-screen.actions';
import { EMPTY, catchError, tap } from 'rxjs';

export interface IMbSignupScreenStateModel {
  signUpResult: SignUpResponseDTO;
}

@State<IMbSignupScreenStateModel>({
  name: 'mbSignupScreenState',
  defaults: {
    signUpResult: null,
  },
})
@Injectable()
export class MbSignupScreenState {
  constructor(private authService: AuthService) {}

  @Selector()
  static signUpResult(state: IMbSignupScreenStateModel): SignUpResponseDTO {
    return state.signUpResult;
  }

  @Action(MbSignupScreenAction.SignupUser)
  signup(
    ctx: StateContext<IMbSignupScreenStateModel>,
    { dto }: { dto: SignUpRequestDTO }
  ) {
    this.authService
      .signUp(dto)
      .pipe(
        tap((res) => {
          ctx.patchState({
            signUpResult: res,
          });
        }),
        catchError((err) => {
          // TODO: Need to handle error here
          console.log(err);
          return EMPTY;
        })
      )
      .subscribe();
  }
}
