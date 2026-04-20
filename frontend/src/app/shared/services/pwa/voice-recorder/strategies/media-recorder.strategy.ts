import type { IWebRecordingStrategy } from '../impl/web-voice-recorder';

const DEFAULT_WEBM_MIME = 'audio/webm';
const MEDIARECORDER_TIMESLICE_MS = 250;

export class MediaRecorderStrategy implements IWebRecordingStrategy {
  readonly engine = 'media-recorder' as const;
  readonly warmupMs: number;

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private activeMimeType = DEFAULT_WEBM_MIME;

  private constructor(warmupMs: number) {
    this.warmupMs = Math.max(0, warmupMs);
  }

  /**
   * Returns a strategy instance if `MediaRecorder` can be constructed for this stream;
   * otherwise `null` (caller should use `WebAudioWavStrategy`).
   */
  static tryCreate(stream: MediaStream, warmupMs: number): MediaRecorderStrategy | null {
    if (typeof MediaRecorder === 'undefined') return null;

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    const mime = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';

    try {
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      const inst = new MediaRecorderStrategy(warmupMs);
      inst.mediaRecorder = recorder;
      inst.activeMimeType = recorder.mimeType || mime || DEFAULT_WEBM_MIME;
      inst.chunks = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          inst.chunks.push(e.data);
        }
      };
      return inst;
    } catch {
      return null;
    }
  }

  async start(): Promise<void> {
    // Emit data in small chunks to reduce memory pressure and avoid "single giant blob" finalization quirks.
    this.mediaRecorder?.start(MEDIARECORDER_TIMESLICE_MS);
  }

  stop(): Promise<Blob> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === 'inactive') {
      return Promise.reject(new Error('Not recording'));
    }

    return new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.activeMimeType || recorder.mimeType || DEFAULT_WEBM_MIME,
        });
        this.disposeRecorderOnly();
        resolve(blob);
      };

      recorder.onerror = () => {
        this.disposeRecorderOnly();
        reject(new Error('MediaRecorder error'));
      };

      try {
        recorder.stop();
      } catch (e) {
        this.disposeRecorderOnly();
        reject(e instanceof Error ? e : new Error('Failed to stop recorder'));
      }
    });
  }

  dispose(): void {
    const recorder = this.mediaRecorder;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => this.disposeRecorderOnly();
      recorder.onerror = null;
      try {
        recorder.stop();
      } catch {
        this.disposeRecorderOnly();
      }
    } else {
      this.disposeRecorderOnly();
    }
  }

  private disposeRecorderOnly(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.onerror = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.activeMimeType = DEFAULT_WEBM_MIME;
  }
}
