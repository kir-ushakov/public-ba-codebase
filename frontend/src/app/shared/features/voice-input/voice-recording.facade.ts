import { inject, Injectable } from '@angular/core';
import {
  VoiceRecorderService,
  VoiceRecorderSessionState,
} from 'src/app/shared/services/pwa/voice-recorder.service';

/**
 * Facade from the voice-input feature to PWA audio capture.
 * Call sites in the voice-input flow should use this facade instead of {@link VoiceRecorderService}.
 */
@Injectable({ providedIn: 'root' })
export class VoiceRecordingFacade {
  private readonly recorder = inject(VoiceRecorderService);

  get isRecording(): boolean {
    return this.recorder.isRecording;
  }

  get recordingSessionState(): VoiceRecorderSessionState {
    return this.recorder.recordingSessionState;
  }

  startRecording(): Promise<void> {
    return this.recorder.startRecording();
  }

  stopRecording(): Promise<Blob> {
    return this.recorder.stopRecording();
  }

  cancelRecording(): void {
    this.recorder.cancelRecording();
  }
}

