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
 * #VOICE-INPUT-WITH-AI__FE__TRIGGER-BUTTON:
 * #VIWAI_FE_TRIGGER-BUTTON:
 *
 * Mic trigger button component: opens the recorder dialog, wires dialog events to
 * the voice-input state, reflects processing via UI state/animation, and emits a
 * completion event back to the parent.
 */
@Component({
  selector: 'ba-task-voice-mic-button',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './task-voice-mic-button.component.html',
  styleUrl: './task-voice-mic-button.component.scss',
})
export class TaskVoiceMicButtonComponent {
  // emit on recording stop
  readonly recordingStopped = output<void>();

  // converting flag from store — drives template (mic vs animated dots)
  readonly voiceToTextConverting$ = inject(Store).select(
    VoiceInputState.voiceToTextConverting,
  );

  private readonly store = inject(Store);
  private readonly dialogService = inject(DialogService);

  // handle mic click — open recorder dialog
  onMicClick(event: MouseEvent): void {
    this.preventInputFocus(event);

    // show voice recorder via dialog service
    const dialogRef = this.dialogService.showFullScreenDialog(VoiceRecorderComponent);
    const recorder = dialogRef.componentInstance as VoiceRecorderComponent;

    // bridge recorder dialog → store + parent
    if (recorder) {
      // user finished recording — convert to text, notify parent
      recorder.stopped.subscribe(() => {
        this.store.dispatch(VoiceInputAction.StopRecordingAndConvertToText);
        this.recordingStopped.emit();
      });
      // user dismissed recorder — cancel without conversion
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
