import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddToSlackRedirectScreenAction } from './add-to-slack-redirect.actions';
import { SlackService } from 'src/app/shared/serivces/integrations/slack.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UserAction } from 'src/app/shared/state/user.actions';
import { ActivatedRoute } from '@angular/router';

export interface IAddToSlackRedirectScreenStateModel {
  isInstalling: boolean;
  errorOccurred: boolean;
}

@State<IAddToSlackRedirectScreenStateModel>({
  name: 'AddToSlackRedirectScreenState',
  defaults: { isInstalling: false, errorOccurred: false },
})
@Injectable()
export class AddToSlackRedirectScreenState {
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _slackService: SlackService
  ) {}
  @Selector()
  static isInstalling(state: IAddToSlackRedirectScreenStateModel): boolean {
    return state.isInstalling;
  }

  @Selector()
  static errorOccurred(state: IAddToSlackRedirectScreenStateModel): boolean {
    return state.errorOccurred;
  }

  @Action(AddToSlackRedirectScreenAction.Opened)
  async opened(ctx: StateContext<IAddToSlackRedirectScreenStateModel>) {
    ctx.patchState({
      isInstalling: true,
      errorOccurred: false,
    });

    try {
      const code: string =
        this._activatedRoute.snapshot.queryParamMap.get('code');

      await this._slackService.addToSlack(code);

      ctx.dispatch(new UserAction.AddedToSlackStatusChanged(true));
      ctx.patchState({
        isInstalling: false,
      });
      ctx.dispatch(AppAction.NavigateToProfileScreen);
    } catch (err) {
      ctx.patchState({
        isInstalling: false,
        errorOccurred: true,
      });
    }
  }
}
