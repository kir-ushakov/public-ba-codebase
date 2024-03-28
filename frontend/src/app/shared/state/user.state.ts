import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { ProfileScreenAction } from 'src/app/mobile-app/components/screens/mb-profile-screen/mb-profile-screen.action';
import { User } from '../models/user.model';
import { AuthService } from '../services/rest/auth.service';
import { AppAction } from './app.actions';
import { UserAction } from './user.actions';
import { SlackService } from '../services/integrations/slack.service';

export interface IUserIntegrations {
  addedToSlack: boolean | undefined;
}
export interface UserStateModel {
  userData: User;
  authState: EUserAuthState;
  integrations: IUserIntegrations;
}

export enum EUserAuthState {
  Authenticated = 'USER_AUTH_STATE_AUTHENTICATED',
  LocalAuthenticated = 'USER_AUTH_STATE_LOCAL_AUTHENTICATED',
}

@State<UserStateModel>({
  name: 'user',
  defaults: {
    userData: null,
    authState: null,
    integrations: {
      addedToSlack: undefined,
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
  static loggedIn(state: UserStateModel): boolean {
    return !!state.userData;
  }

  @Selector()
  static localAuthenticated(state: UserStateModel): boolean {
    return state.authState === EUserAuthState.LocalAuthenticated;
  }

  @Selector()
  static userNameFirstLetter(state: UserStateModel): string {
    if (state.userData) {
      const firstName = state.userData.firstName;
      return firstName ? firstName.charAt(0) : null;
    }
    return null;
  }

  @Selector()
  static userId(state: UserStateModel): string {
    return state.userData.userId;
  }

  @Selector()
  static userName(state: UserStateModel): string {
    return `${state.userData.firstName} ${state.userData.lastName}`;
  }

  @Selector()
  static userEmail(state: UserStateModel): string {
    return state.userData.email;
  }

  @Selector()
  static addedToSlack(state: UserStateModel): boolean {
    return state.integrations.addedToSlack;
  }

  @Action(UserAction.LogIn)
  async login(
    ctx: StateContext<UserStateModel>,
    { email, password }: UserAction.LogIn
  ): Promise<void> {
    try {
      const user: User = await this._authService.login({
        username: email,
        password,
      });
      ctx.dispatch(new UserAction.LoggedIn(user));
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          ctx.dispatch(new UserAction.AuthFailed(err.error.message));
        }
      }
      console.log(err);
    }
  }

  @Action(UserAction.LoggedIn)
  loggedIn(
    ctx: StateContext<UserStateModel>,
    { userData }: UserAction.LoggedIn
  ): void {
    ctx.patchState({
      userData: userData,
      authState: EUserAuthState.Authenticated,
    });
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(ProfileScreenAction.Logout)
  async logout(ctx: StateContext<UserStateModel>): Promise<void> {
    try {
      await this._authService.logout();
      ctx.patchState({ userData: null });
      ctx.dispatch(UserAction.LoggedOut);
      ctx.dispatch(AppAction.NavigateToLoginScreen);
    } catch (err) {
      console.log(err);
    }
  }

  @Action(UserAction.NotAuthenticated)
  notAuthenticated(ctx: StateContext<UserStateModel>): void {
    if (UserState.loggedIn(ctx.getState())) {
      ctx.patchState({ authState: EUserAuthState.LocalAuthenticated });
    }
  }

  @Action(UserAction.Relogin)
  async relogin(
    ctx: StateContext<UserStateModel>,
    { password }: UserAction.Relogin
  ): Promise<void> {
    try {
      const email = ctx.getState().userData.email;
      const user: User = await this._authService.login({
        username: email,
        password,
      });
      ctx.dispatch(new UserAction.LoggedIn(user));
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          ctx.dispatch(new UserAction.AuthFailed(err.error.message));
        }
      }
      console.log(err);
    }
  }

  @Action(UserAction.AddedToSlackStatusChanged)
  addedToSlackStatusChanged(
    ctx: StateContext<UserStateModel>,
    { status }: { status: boolean }
  ): void {
    const integrationsState = ctx.getState().integrations;
    ctx.patchState({
      integrations: { ...integrationsState, addedToSlack: status },
    });
  }

  @Action(ProfileScreenAction.RemoveFromSlack)
  async removeFromSlack(ctx: StateContext<UserStateModel>): Promise<void> {
    try {
      await this._slackService.removeFromSlack();
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        ctx.dispatch(new UserAction.AddedToSlackStatusChanged(false));
      } else {
        return;
      }
      console.log(err.error.message);
    }
    ctx.dispatch(new UserAction.AddedToSlackStatusChanged(false));
  }
}
