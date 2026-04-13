import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import { VoiceRecorderComponent } from 'src/app/shared/components/ui-elements/speech-recorder/voice-recorder.component';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
/**
 * #VIWAI_FE_TRIGGER-BUTTON:
 *
 * Voice-input trigger: opens the recorder dialog, wires dialog events to the
 * voice-input state, reflects processing via UI state/animation, and emits a
 * completion event back to the parent.
 */
@Component({
  selector: 'ba-voice-input-trigger',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './voice-input-trigger.component.html',
  styleUrl: './voice-input-trigger.component.scss',
})
export class VoiceInputTriggerComponent {
  // emit on recording stop
  readonly recordingStopped = output<void>();

  // converting flag from store — drives template (idle icon vs animated dots)
  readonly voiceToTextConverting$ = inject(Store).select(
    VoiceInputState.voiceToTextConverting,
  );

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
