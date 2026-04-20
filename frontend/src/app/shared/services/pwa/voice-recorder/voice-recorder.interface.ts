export interface IVoiceRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  cancel(): void;
}
