import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import { VoiceRecorderComponent } from 'src/app/shared/components/ui-elements/speech-recorder/voice-recorder.component';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';

@Component({
  selector: 'ba-task-voice-mic-button',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './task-voice-mic-button.component.html',
  styleUrl: './task-voice-mic-button.component.scss',
})
export class TaskVoiceMicButtonComponent {
  readonly recordingStopped = output<void>();

  readonly voiceToTextConverting$ = inject(Store).select(
    VoiceInputState.voiceToTextConverting,
  );

  private readonly store = inject(Store);
  private readonly dialogService = inject(DialogService);

  onMicClick(event: MouseEvent): void {
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
