import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddToSlackRedirectScreenAction } from './add-to-slack-redirect.actions';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { SlackAPIAction } from 'src/app/shared/services/integrations/slack.api.actions';

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
  constructor(private _slackService: SlackService) {}

  @Selector()
  static isInstalling(state: IAddToSlackRedirectScreenStateModel): boolean {
    return state.isInstalling;
  }

  @Selector()
  static errorOccurred(state: IAddToSlackRedirectScreenStateModel): boolean {
    return state.errorOccurred;
  }

  @Action(AddToSlackRedirectScreenAction.Opened)
  async opened(
    ctx: StateContext<IAddToSlackRedirectScreenStateModel>,
    payload: AddToSlackRedirectScreenAction.Opened,
  ) {
    const { code } = { ...payload };
    ctx.patchState({
      isInstalling: true,
      errorOccurred: false,
    });

    try {
      await this._slackService.addToSlack(code);

      ctx.patchState({
        isInstalling: false,
      });

      ctx.dispatch(SlackAPIAction.AddedToSlack);
      ctx.dispatch(AppAction.NavigateToProfileScreen);
    } catch (err) {
      ctx.patchState({
        isInstalling: false,
        errorOccurred: true,
      });
    }
  }
}
