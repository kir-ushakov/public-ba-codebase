import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import type { IVoiceRecorder } from './voice-recorder.type';
import { WebVoiceRecorder } from './impl/web-voice-recorder';
import { NativeVoiceRecorder } from './native-voice-recorder';

export enum VoiceRecorderState {
  Idle = 'idle',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping',
}

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
    if (this.state !== VoiceRecorderState.Recording) {
      throw new Error('Not recording');
    }
    this.state = VoiceRecorderState.Stopping;
    const blob = await this.impl.stop();
    this.state = VoiceRecorderState.Idle;
    return blob;
  }

  cancel(): void {
    this.impl.cancel();
    this.state = VoiceRecorderState.Idle;
  }

  get isRecording(): boolean {
    return this.state === VoiceRecorderState.Recording;
  }
}
