import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | undefined;
  private _isRecording = false;
  private abortController: AbortController | null = null;

  get isRecording(): boolean {
    return this._isRecording;
  }

  async startRecording(): Promise<void> {
    this.abortController?.abort();
    const abortController = new AbortController();
    this.abortController = abortController;

    const constraints: MediaStreamConstraints & { signal?: AbortSignal } = {
      audio: true,
      signal: abortController.signal,
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (abortController.signal.aborted) {
      this.cleanup();
      return;
    }

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = event => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
    this._isRecording = true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
      this._isRecording = false;
    });
  }

  cancelRecording(): void {
    this.abortController?.abort();
    this.abortController = null;

    const recorder = this.mediaRecorder;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        this.audioChunks = [];
        this.cleanup();
      };
      recorder.stop();
    } else {
      this.cleanup();
    }
    this._isRecording = false;
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    this.abortController = null;
  }
}
