import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  private stream: MediaStream;
  private _isRecording = false;

  get isRecording(): boolean {
    return this._isRecording;
  }

  set isRecording(value: boolean) {
    this._isRecording = value;
  }

  async startRecording(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = event => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
    this._isRecording = true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise(resolve => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
      this._isRecording = false;
    });
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach(track => track.stop());
  }
}
