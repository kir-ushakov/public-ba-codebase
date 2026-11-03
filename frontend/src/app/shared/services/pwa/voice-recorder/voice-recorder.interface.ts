export type VoiceCaptureEngine = 'media-recorder' | 'web-audio-wav' | 'native';

export interface IVoiceRecorder {
  readonly engine: VoiceCaptureEngine | null;
  start(): Promise<void>;
  stop(): Promise<Blob>;
  cancel(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  capturedBytes(): number;
  /** Live microphone level in the range 0..1. 0 when the capture path has no meter. */
  level(): number;
}
