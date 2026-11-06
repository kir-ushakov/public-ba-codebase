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
  /**
   * One level per bar, each 0..1, from the open capture stream.
   * Empty when this capture path has no meter.
   */
  levels(barCount: number): number[];
  /**
   * Fired when the capture device ends on its own, for example the microphone
   * is unplugged. Implementations that cannot observe this omit the method.
   */
  observeUnexpectedEnd?(handler: () => void): void;
}
