import { Injectable, inject } from '@angular/core';
import type { StateContext } from '@ngxs/store';
import { Action, Selector, State, Store } from '@ngxs/store';
import { VoiceInputAction } from './voice-input.actions';
import { VoiceRecordingFacade } from '../voice-recording.facade';
import { SpeechToTextService } from 'src/app/shared/services/api/speech-to-text.service';
import { firstValueFrom } from 'rxjs';
import { AppAction } from 'src/app/shared/state/app.actions';

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
  private readonly store = inject(Store);
  private readonly voiceRecordingFacade = inject(VoiceRecordingFacade);
  private readonly speechToTextService = inject(SpeechToTextService);

  @Selector()
  static voiceToTextConverting(state: IVoiceInputStateModel): boolean {
    return state.voiceToTextConverting;
  }

  @Action(VoiceInputAction.Reset)
  reset(ctx: StateContext<IVoiceInputStateModel>): void {
    ctx.setState(defaults);
  }

  @Action(VoiceInputAction.StopRecordingAndConvertToText)
  async stopRecordingAndConvertToText(ctx: StateContext<IVoiceInputStateModel>): Promise<void> {
    try {
      if (!this.voiceRecordingFacade.isRecording) {
        return;
      }

      ctx.patchState({ voiceToTextConverting: true });

      const record: Blob = await this.voiceRecordingFacade.stopRecording();
      const result = await firstValueFrom(this.speechToTextService.uploadAudio(record));

      ctx.patchState({ voiceToTextConverting: false });
      ctx.dispatch(new VoiceInputAction.VoiceToTextConvertedSuccessfully(result.transcript));
    } catch (error) {
      console.error(error);
      ctx.patchState({ voiceToTextConverting: false });
      ctx.dispatch(VoiceInputAction.VoiceToTextConvertedFailed);
      this.store.dispatch(new AppAction.ShowErrorInUI('Voice Conversion To Text Failed'));
    }
  }

  @Action(VoiceInputAction.CancelRecording)
  cancelRecording(ctx: StateContext<IVoiceInputStateModel>): void {
    this.voiceRecordingFacade.cancelRecording();
    ctx.patchState({ voiceToTextConverting: false });
  }

  @Action(VoiceInputAction.VoiceToTextConvertingStatusSet)
  voiceToTextConvertingStatusSet(
    ctx: StateContext<IVoiceInputStateModel>,
    { converting }: VoiceInputAction.VoiceToTextConvertingStatusSet,
  ): void {
    ctx.patchState({ voiceToTextConverting: converting });
  }
}
