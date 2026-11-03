import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import type { IVoiceRecorder, VoiceCaptureEngine } from './voice-recorder.interface';
import { WebVoiceRecorder } from './impl/web-voice-recorder';
import { NativeVoiceRecorder } from './impl/native-voice-recorder';

export enum VoiceRecorderState {
  Idle = 'idle',
  Starting = 'starting',
  Recording = 'recording',
  Paused = 'paused',
  Stopping = 'stopping',
}

/**
 * #VIWAI_FE_VOICE-RECORDER-SERVICE:
 *
 * Voice recorder service: provides a single API for starting/stopping/canceling an audio
 * recording session across platforms.
 *
 * Internally, it selects the appropriate implementation (native vs web) at runtime and
 * exposes a small state machine (`VoiceRecorderState`) so UI/components can reliably
 * react to transitions (idle → starting → recording → stopping → idle).
 *
 * This service also guards invalid operations (e.g. `stop()` when not recording) and
 * guarantees that the state is reset back to `Idle` after stop/cancel.
 */
@Injectable({ providedIn: 'root' })
export class VoiceRecorderService implements IVoiceRecorder {
  private readonly impl: IVoiceRecorder;
  private state: VoiceRecorderState = VoiceRecorderState.Idle;

  constructor() {
    this.impl = Capacitor.isNativePlatform() ? new NativeVoiceRecorder() : new WebVoiceRecorder();
  }

  get recordingState(): VoiceRecorderState {
    return this.state;
  }

  async start(): Promise<void> {
    this.state = VoiceRecorderState.Starting;
    await this.impl.start();
    this.state = VoiceRecorderState.Recording;
  }

  async stop(): Promise<Blob> {
    if (this.state !== VoiceRecorderState.Recording && this.state !== VoiceRecorderState.Paused) {
      throw new Error('Not recording');
    }
    this.state = VoiceRecorderState.Stopping;
    try {
      const blob = await this.impl.stop();
      return blob;
    } finally {
      this.state = VoiceRecorderState.Idle;
    }
  }

  cancel(): void {
    this.impl.cancel();
    this.state = VoiceRecorderState.Idle;
  }

  get isRecording(): boolean {
    return this.state === VoiceRecorderState.Recording;
  }

  get engine(): VoiceCaptureEngine | null {
    return this.impl.engine;
  }

  async pause(): Promise<void> {
    if (this.state !== VoiceRecorderState.Recording) {
      throw new Error('Not recording');
    }
    await this.impl.pause();
    this.state = VoiceRecorderState.Paused;
  }

  async resume(): Promise<void> {
    if (this.state !== VoiceRecorderState.Paused) {
      throw new Error('Not paused');
    }
    await this.impl.resume();
    this.state = VoiceRecorderState.Recording;
  }

  capturedBytes(): number {
    return this.impl.capturedBytes();
  }

  level(): number {
    if (this.state !== VoiceRecorderState.Recording) {
      return 0;
    }
    return this.impl.level();
  }

  levels(barCount: number): number[] {
    if (this.state !== VoiceRecorderState.Recording) {
      return [];
    }
    return this.impl.levels(barCount);
  }
}
