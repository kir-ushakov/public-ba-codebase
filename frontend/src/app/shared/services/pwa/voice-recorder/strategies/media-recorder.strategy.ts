import type { IWebRecordingStrategy } from '../impl/web-voice-recorder';

const DEFAULT_WEBM_MIME = 'audio/webm';
const MEDIARECORDER_TIMESLICE_MS = 250;
/** Target for Opus voice notes. Raise to 48_000 if transcription quality drops. */
const OPUS_AUDIO_BITS_PER_SECOND = 32_000;
const AAC_AUDIO_BITS_PER_SECOND = 48_000;

/**
 * #VIWAI_FE_MEDIA-RECORDER-STRATEGY:
 *
 * Media recorder strategy: provides a media recorder implementation of the voice recorder service.
 *
 * This implementation uses the Media Recorder API to record audio.
 *
 * Conceptually:
 * - Prefer this strategy when it's available: it delegates encoding/muxing to the browser,
 *   which is typically the most CPU- and battery-efficient path and scales better for longer recordings.
 * - Output format is browser/OS dependent (e.g. `audio/webm;codecs=opus`, `audio/mp4`, `audio/ogg`),
 *   so the resulting container/codec can vary across devices and may require server-side normalization.
 * - "Reliability" here means runtime stability: fewer JS callbacks and less memory churn compared to
 *   manual PCM capture; however, finalization depends on the implementation (stop/onstop timing, MIME quirks).
 * - Latency/streaming: can emit periodic encoded chunks (`timeslice`) and keep memory pressure low.
 */
export class MediaRecorderStrategy implements IWebRecordingStrategy {
  readonly engine = 'media-recorder' as const;

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private activeMimeType = DEFAULT_WEBM_MIME;
  private rejectStart: ((error: Error) => void) | null = null;

  private constructor() {}

  /**
   * Returns a strategy instance if `MediaRecorder` can be constructed for this stream;
   * otherwise `null` (caller should use `WebAudioWavStrategy`).
   */
  static tryCreate(stream: MediaStream): MediaRecorderStrategy | null {
    if (typeof MediaRecorder === 'undefined') return null;

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    const mime = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';

    try {
      const recorder = createMediaRecorder(stream, mime);
      const inst = new MediaRecorderStrategy();
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

  start(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder) {
      return Promise.reject(new Error('Recorder is not initialized'));
    }
    if (recorder.state === 'recording') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const cleanup = (): void => {
        this.rejectStart = null;
        recorder.removeEventListener('start', onStart);
        recorder.removeEventListener('error', onError);
      };
      const onStart = (): void => {
        cleanup();
        if (!this.mediaRecorder) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        resolve();
      };
      const onError = (): void => {
        cleanup();
        reject(new Error('MediaRecorder error'));
      };

      this.rejectStart = reject;
      recorder.addEventListener('start', onStart);
      recorder.addEventListener('error', onError);
      try {
        // Emit data in small chunks to reduce memory pressure and avoid one giant final blob.
        recorder.start(MEDIARECORDER_TIMESLICE_MS);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('Failed to start recorder'));
      }
    });
  }

  async pause(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state !== 'recording') {
      throw new Error('Not recording');
    }
    recorder.pause();
  }

  async resume(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state !== 'paused') {
      throw new Error('Not paused');
    }
    recorder.resume();
  }

  capturedBytes(): number {
    return this.chunks.reduce((total, chunk) => total + chunk.size, 0);
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
    this.rejectStart?.(new DOMException('Aborted', 'AbortError'));
    this.rejectStart = null;
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

/**
 * Requested bitrate only — browsers may pick another value.
 * Opus / generic WebM → 32 kbps; MP4/AAC → 48 kbps.
 */
export function mediaRecorderOptions(mimeType: string): MediaRecorderOptions {
  return {
    mimeType,
    audioBitsPerSecond: requestedAudioBitsPerSecond(mimeType),
  };
}

export function requestedAudioBitsPerSecond(mimeType: string): number {
  const mime = mimeType.toLowerCase();
  const isOpus = mime.includes('opus') || mime === 'audio/webm' || mime.startsWith('audio/ogg');
  return isOpus ? OPUS_AUDIO_BITS_PER_SECOND : AAC_AUDIO_BITS_PER_SECOND;
}

function createMediaRecorder(stream: MediaStream, mime: string): MediaRecorder {
  if (!mime) {
    return new MediaRecorder(stream);
  }

  try {
    return new MediaRecorder(stream, mediaRecorderOptions(mime));
  } catch {
    // Some stacks reject audioBitsPerSecond; keep the MIME if bitrate options fail.
    return new MediaRecorder(stream, { mimeType: mime });
  }
}
