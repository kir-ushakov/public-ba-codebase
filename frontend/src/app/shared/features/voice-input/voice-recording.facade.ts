import { inject, Injectable } from '@angular/core';
import {
  VoiceRecorderService,
  VoiceRecorderState,
} from 'src/app/shared/services/pwa/voice-recorder';
import type { VoiceCaptureEngine } from 'src/app/shared/services/pwa/voice-recorder';

/**
 * #VIWAI_FE_VOICE-RECORDING-FACADE:
 *
 * Voice recording facade: the boundary between the `voice-input` feature and audio recording infrastructure.
 *
 * From an architectural perspective, voice input is implemented as an independent feature module, so related UI,
 * business logic and state live under `features/voice-input`. This makes it easier to reuse later (e.g. extract into
 * a library or a web component) and to share across projects.
 *
 * Audio recording itself is infrastructure-level: {@link VoiceRecorderService} talks directly to browser APIs like
 * `MediaRecorder` and `getUserMedia` (device access, capturing, Blob creation) and contains no product-specific logic.
 * It belongs to the shared platform/device layer.
 *
 * To avoid coupling the feature to the infrastructure, call sites in the voice-input flow should depend on this
 * facade (start/stop/cancel + `isRecording`) rather than using {@link VoiceRecorderService} directly.
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

  pauseRecording(): Promise<void> {
    return this.recorder.pause();
  }

  resumeRecording(): Promise<void> {
    return this.recorder.resume();
  }

  capturedBytes(): number {
    return this.recorder.capturedBytes();
  }

  level(): number {
    return this.recorder.level();
  }

  get engine(): VoiceCaptureEngine | null {
    return this.recorder.engine;
  }

  get recordingState(): VoiceRecorderState {
    return this.recorder.recordingState;
  }
}
