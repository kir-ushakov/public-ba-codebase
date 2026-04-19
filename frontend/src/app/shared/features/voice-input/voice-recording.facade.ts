import { inject, Injectable } from '@angular/core';
import { VoiceRecorderService } from 'src/app/shared/services/pwa/voice-recorder';

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

  startRecording(): Promise<void> {
    return this.recorder.start();
  }

  stopRecording(): Promise<Blob> {
    return this.recorder.stop();
  }

  cancelRecording(): void {
    this.recorder.cancel();
  }
}

