import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { MbProfileScreenAction } from 'src/app/mobile-app/components/screens/mb-profile-screen/mb-profile-screen.actions';
import { User } from '../models/user.model';
import { AuthService } from '../services/api/auth.service';
import { AppAction } from './app.actions';
import { SlackService } from '../services/integrations/slack.service';
import { MbLoginScreenAction } from 'src/app/mobile-app/components/screens/mb-login-screen/mb-login-screen.actions';
import { MbSyncScreenAction } from 'src/app/mobile-app/components/screens/mb-sync-screen/mb-sync-screen.actions';
import { SlackAPIAction } from '../services/integrations/slack.api.actions';
import { AuthAPIAction } from '../services/api/auth.actions';
import { EMPTY, catchError, tap } from 'rxjs';
import { GoogleAPIAction } from '../services/integrations/google-api.actions';


interface IUserIntegrations {
  isAddedToSlack: boolean | undefined;
}
export interface IUserStateModel {
  userData: User | null;
  authState: EUserAuthState;
  integrations: IUserIntegrations;
}

export enum EUserAuthState {
  Authenticated = 'USER_AUTH_STATE_AUTHENTICATED',
  LocalAuthenticated = 'USER_AUTH_STATE_LOCAL_AUTHENTICATED',
}

@State<IUserStateModel>({
  name: 'user',
  defaults: {
    userData: null,
    authState: null,
    integrations: {
      isAddedToSlack: undefined,
    },
  },
})
@Injectable()
export class UserState {
  constructor(
    private _authService: AuthService,
    private _slackService: SlackService
  ) {}

  @Selector()
  static isLoggedIn(state: IUserStateModel): boolean {
    return !!state.userData;
  }

  @Selector()
  static isLocalAuthenticated(state: IUserStateModel): boolean {
    return state.authState === EUserAuthState.LocalAuthenticated;
  }

  @Selector()
  static userNameFirstLetter(state: IUserStateModel): string {
    if (state.userData) {
      const firstName = state.userData.firstName;
      return firstName ? firstName.charAt(0) : null;
    }
    return null;
  }

  @Selector()
  static userId(state: IUserStateModel): string {
    return state.userData.userId;
  }

  @Selector()
  static userFullName(state: IUserStateModel): string | null{
    return `${state.userData?.firstName} ${state.userData?.lastName}`;
  }

  @Selector()
  static userEmail(state: IUserStateModel): string | null {
    return state.userData?.email;
  }

  @Selector()
  static isAddedToSlack(state: IUserStateModel): boolean {
    return state.integrations.isAddedToSlack;
  }

  @Action(MbLoginScreenAction.LoginUser)
  async login(
    ctx: StateContext<IUserStateModel>,
    { email, password }: { email: string; password: string }
  ): Promise<void> {
    this.loginUser(ctx, email, password);
  }

  @Action(AuthAPIAction.UserLoggedIn)
  @Action(GoogleAPIAction.UserAuthenticated)
  loggedIn(
    ctx: StateContext<IUserStateModel>,
    { userData }: { userData: User }
  ): void {
    ctx.patchState({
      userData: userData,
      authState: EUserAuthState.Authenticated,
    });
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(MbProfileScreenAction.Logout)
  logout(ctx: StateContext<IUserStateModel>): void {
    this._authService
      .logout()
      .pipe(
        catchError((err) => {
          ctx.dispatch(AuthAPIAction.UserLogoutFailed);
          return EMPTY;
        })
      )
      .subscribe(() => { 
        ctx.setState(patch({ userData: null }));
        ctx.dispatch(AuthAPIAction.UserLoggedOut);
        ctx.dispatch(AppAction.NavigateToLoginScreen);
      });
  }

  @Action(AppAction.UserNotAuthenticated)
  notAuthenticated(ctx: StateContext<IUserStateModel>): void {
    if (UserState.isLoggedIn(ctx.getState())) {
      ctx.patchState({ authState: EUserAuthState.LocalAuthenticated });
    }
  }

  @Action(MbSyncScreenAction.Relogin)
  async relogin(
    ctx: StateContext<IUserStateModel>,
    { password }: { password: string }
  ): Promise<void> {
    const email = ctx.getState().userData.email;
    this.loginUser(ctx, email, password);
  }

  @Action(SlackAPIAction.AddedToSlack)
  addedToSlack(ctx: StateContext<IUserStateModel>): void {
    const integrationsState = ctx.getState().integrations;
    ctx.patchState({
      integrations: { ...integrationsState, isAddedToSlack: true },
    });
  }

  @Action(SlackAPIAction.RemovedFromSlack)
  removedFromSlack(ctx: StateContext<IUserStateModel>): void {
    const integrationsState = ctx.getState().integrations;
    ctx.patchState({
      integrations: { ...integrationsState, isAddedToSlack: false },
    });
  }

  @Action(MbProfileScreenAction.RemoveFromSlack)
  async removeFromSlack(ctx: StateContext<IUserStateModel>): Promise<void> {
    try {
      await this._slackService.removeFromSlack();
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        // For some reason already removed (not found) on BE
        // so just set same in state on FE
        ctx.dispatch(SlackAPIAction.RemovedFromSlack);
      } else {
        return;
      }
      console.log(err.error.message);
    }
    ctx.dispatch(SlackAPIAction.RemovedFromSlack);
  }

  private loginUser(
    ctx: StateContext<IUserStateModel>,
    email: string,
    password: string
  ) {
    this._authService
      .login({
        username: email,
        password,
      })
      .pipe(
        tap((user: User) => {
          ctx.dispatch(new AuthAPIAction.UserLoggedIn(user));
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              ctx.dispatch(new AuthAPIAction.UserAuthFailed(err.error.message));
            }
          } else {
            // TODO: Need to handle error here
            console.log(err);
          }
          return EMPTY;
        })
      )
      .subscribe();
  }
}
