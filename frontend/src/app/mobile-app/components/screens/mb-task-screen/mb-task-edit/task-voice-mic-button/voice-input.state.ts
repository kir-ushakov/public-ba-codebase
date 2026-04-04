import { Injectable } from '@angular/core';
import type { StateContext } from '@ngxs/store';
import { Action, Selector, State } from '@ngxs/store';
import { VoiceInputAction } from './voice-input.actions';

export interface IVoiceInputStateModel {
  voiceToTextConverting: boolean;
}

const defaults: IVoiceInputStateModel = {
  voiceToTextConverting: false,
};

@State<IVoiceInputStateModel>({
  name: 'voiceInput',
  defaults,
})
@Injectable()
export class VoiceInputState {
  @Selector()
  static voiceToTextConverting(state: IVoiceInputStateModel): boolean {
    return state.voiceToTextConverting;
  }

  @Action(VoiceInputAction.Reset)
  reset(ctx: StateContext<IVoiceInputStateModel>): void {
    ctx.setState(defaults);
  }

  @Action(VoiceInputAction.VoiceToTextConvertingSet)
  voiceToTextConvertingSet(
    ctx: StateContext<IVoiceInputStateModel>,
    { converting }: VoiceInputAction.VoiceToTextConvertingSet,
  ): void {
    ctx.patchState({ voiceToTextConverting: converting });
  }
}
