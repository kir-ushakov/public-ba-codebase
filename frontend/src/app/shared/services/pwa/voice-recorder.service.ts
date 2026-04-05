import { Injectable } from '@angular/core';

const DEFAULT_AUDIO_MIME = 'audio/webm';

/** High-level lifecycle of a single recording attempt (decoupled from async `MediaRecorder` transitions). */
export enum VoiceRecorderSessionState {
  Idle = 'idle',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping',
}

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | undefined;
  private sessionState = VoiceRecorderSessionState.Idle;
  private abortController: AbortController | null = null;
  private activeMimeType = '';
  /** `reject` from the in-flight `stopRecording()` promise, if any */
  private stopRecordingReject: ((reason: Error) => void) | null = null;

  get recordingSessionState(): VoiceRecorderSessionState {
    return this.sessionState;
  }

  get isRecording(): boolean {
    return this.sessionState === VoiceRecorderSessionState.Recording;
  }

  async startRecording(): Promise<void> {
    this.abortController?.abort();
    const abortController = new AbortController();
    this.abortController = abortController;
    this.sessionState = VoiceRecorderSessionState.Starting;

    const constraints: MediaStreamConstraints & { signal?: AbortSignal } = {
      audio: true,
      signal: abortController.signal,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (abortController.signal.aborted) {
        this.releaseMedia();
        return;
      }

      this.audioChunks = [];
      this.startMediaRecorder(this.stream);
    } catch (e) {
      this.releaseMedia();
      throw e;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (this.sessionState !== VoiceRecorderSessionState.Recording) {
        reject(new Error('Not recording'));
        return;
      }

      const recorder = this.mediaRecorder;
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Not recording'));
        return;
      }

      this.stopRecordingReject = reject;

      recorder.onstop = () => {
        this.stopRecordingReject = null;
        const blob = new Blob(this.audioChunks, {
          type: this.activeMimeType || DEFAULT_AUDIO_MIME,
        });
        this.releaseMedia();
        resolve(blob);
      };

      recorder.stop();
      this.sessionState = VoiceRecorderSessionState.Stopping;
    });
  }

  cancelRecording(): void {
    this.abortController?.abort();
    this.abortController = null;

    const recorder = this.mediaRecorder;
    if (recorder && recorder.state !== 'inactive') {
      this.sessionState = VoiceRecorderSessionState.Stopping;
      recorder.onstop = () => {
        this.audioChunks = [];
        this.releaseMedia();
      };
      recorder.stop();
    } else {
      this.releaseMedia();
    }
  }

  private static pickRecorderMimeType(): string | undefined {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const mimeType of candidates) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return undefined;
  }

  private static recorderErrorMessage(recorder: MediaRecorder | null): string {
    const dom = (recorder as unknown as { error?: DOMException | null })?.error;
    return dom?.message ?? 'MediaRecorder error';
  }

  private startMediaRecorder(stream: MediaStream): void {
    const preferredMime = VoiceRecorderService.pickRecorderMimeType();
    const recorder = preferredMime
      ? new MediaRecorder(stream, { mimeType: preferredMime })
      : new MediaRecorder(stream);

    this.mediaRecorder = recorder;
    this.activeMimeType = recorder.mimeType || preferredMime || DEFAULT_AUDIO_MIME;

    recorder.ondataavailable = event => {
      this.audioChunks.push(event.data);
    };

    recorder.onerror = () => {
      this.failPendingStop(
        new Error(VoiceRecorderService.recorderErrorMessage(recorder)),
      );
      this.releaseMedia();
    };

    recorder.start();
    this.sessionState = VoiceRecorderSessionState.Recording;
  }

  /** Rejects the `stopRecording()` promise if `stopRecording()` was called and we are still waiting. */
  private failPendingStop(error: Error): void {
    const reject = this.stopRecordingReject;
    this.stopRecordingReject = null;
    reject?.(error);
  }

  /** Stops tracks and clears recorder state. */
  private releaseMedia(): void {
    this.failPendingStop(new Error('Recording was interrupted'));

    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    this.abortController = null;
    this.mediaRecorder = null;
    this.activeMimeType = '';
    this.sessionState = VoiceRecorderSessionState.Idle;
  }
}
