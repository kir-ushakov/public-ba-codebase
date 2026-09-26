import { Component, computed, inject, output } from '@angular/core';
import { createSelectMap, Store } from '@ngxs/store';
import { VoiceRecorderComponent } from 'src/app/shared/features/voice-input/components/voice-recorder/voice-recorder.component';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
import { UserState } from 'src/app/shared/state/user.state';
import { AppState } from 'src/app/shared/state/app.state';
/**
 * #VIWAI_FE_TRIGGER-BUTTON:
 *
 * Voice-input trigger: opens the recorder dialog, wires dialog events to the
 * voice-input state, reflects processing via UI state/animation, and emits a
 * completion event back to the parent.
 *
 * Shown only when the user is logged in and the app is online — speech-to-text
 * needs both a session and the network.
 */
@Component({
  selector: 'ba-voice-input-trigger',
  templateUrl: './voice-input-trigger.component.html',
  styleUrl: './voice-input-trigger.component.scss',
  host: {
    '[hidden]': '!isVisible()',
  },
})
export class VoiceInputTriggerComponent {
  // emit on recording stop
  readonly recordingStopped = output<void>();

  readonly selectors = createSelectMap({
    voiceToTextConverting: VoiceInputState.voiceToTextConverting,
    isLoggedIn: UserState.isLoggedIn,
    online: AppState.online,
  });

  readonly isAvailable = computed(() => this.selectors.isLoggedIn() && this.selectors.online());

  readonly isVisible = computed(() => this.selectors.voiceToTextConverting() || this.isAvailable());

  private readonly store = inject(Store);
  private readonly dialogService = inject(DialogService);

  onVoiceInputClick(event: MouseEvent): void {
    this.preventInputFocus(event);

    const dialogRef = this.dialogService.showFullScreenDialog(VoiceRecorderComponent);
    const recorder = dialogRef.componentInstance as VoiceRecorderComponent;

    if (recorder) {
      recorder.stopped.subscribe(() => {
        this.store.dispatch(VoiceInputAction.StopRecordingAndConvertToText);
        this.recordingStopped.emit();
      });
      recorder.canceled.subscribe(() => {
        this.store.dispatch(VoiceInputAction.CancelRecording);
      });
    }
  }

  preventInputFocus(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
