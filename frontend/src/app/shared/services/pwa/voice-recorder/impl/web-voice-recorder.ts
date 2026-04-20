import type { IVoiceRecorder } from '../voice-recorder.type';
import { MediaRecorderStrategy } from '../strategies/media-recorder.strategy';
import { WebAudioWavStrategy } from '../strategies/web-audio-wav.strategy';

export type VoiceRecorderEngine = 'media-recorder' | 'web-audio-wav';

/**
 * Pluggable **web** capture implementation used after the browser already exposed a mic
 * `MediaStream` from `navigator.mediaDevices.getUserMedia()` (the stream is opened in
 * {@link WebVoiceRecorder}).
 *
 * `WebVoiceRecorder` owns the stream (start/stop tracks, abort). A strategy only wires **how**
 * audio is turned into a {@link Blob}:
 * - **MediaRecorder** — preferred when the browser can record (e.g. WebM/Opus).
 * - **WebAudio → WAV** — fallback when `MediaRecorder` is missing or cannot be constructed.
 *   (common on some Safari/iOS setups).
 *
 * See {@link IWebRecordingStrategy.dispose} for what is released vs. what the facade owns.
 */
export interface IWebRecordingStrategy {
  readonly engine: VoiceRecorderEngine;
  /**
   * Optional "warm-up" time before the capture is considered stable.
   *
   * On some Windows stacks (communications processing / driver DSP), the first ~1s after mic
   * activation can have a noticeable level/quality shift. We treat that period as warm-up:
   * - UI should not start the "max duration" countdown yet.
   * - Some strategies may discard audio during warm-up (e.g. PCM capture), while others simply
   *   delay starting the actual encoder (e.g. MediaRecorder).
   */
  readonly warmupMs: number;
  start(): Promise<void>;
  stop(): Promise<Blob>;
  dispose(): void;
}

/**
 * Web capture facade: acquires mic once, then delegates to a concrete strategy
 * ({@link MediaRecorderStrategy} or {@link WebAudioWavStrategy}).
 */
export class WebVoiceRecorder implements IVoiceRecorder {
  /**
   * Warm-up window to avoid capturing the initial "unstable" mic second on some stacks.
   * Implemented as delay-start: audio during this window does not enter the final blob.
   */
  private static readonly WARMUP_MS = 700;

  private stream: MediaStream | null = null;
  private abortController: AbortController | null = null;
  private strategy: IWebRecordingStrategy | null = null;

  async start(): Promise<void> {
    this.cancel();

    const abortController = new AbortController();
    this.abortController = abortController;

    try {
      // Request browser DSP for voice capture (best-effort; not guaranteed on all devices/browsers).
      // We fall back to `audio: true` if the browser rejects advanced constraints.
      const preferred: MediaStreamConstraints & { signal?: AbortSignal } = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        signal: abortController.signal,
      };
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(preferred);
      } catch {
        const fallback: MediaStreamConstraints & { signal?: AbortSignal } = {
          audio: true,
          signal: abortController.signal,
        };
        this.stream = await navigator.mediaDevices.getUserMedia(fallback);
      }
    } catch (e) {
      this.releaseAll();
      throw e;
    }

    if (abortController.signal.aborted) {
      this.releaseAll();
      return;
    }

    // Warm-up: on some Windows audio stacks the first ~1s after mic activation can contain an audible dip.
    // We treat it as a warm-up period: UI countdown starts after it; the captured blob excludes it.
    const warmupMs = WebVoiceRecorder.WARMUP_MS;

    // Strategy selection:
    // - Prefer MediaRecorder when available (small, browser-native codecs like WebM/Opus).
    // - Fall back to WebAudio→WAV when MediaRecorder is missing or cannot be constructed (common on Safari/iOS).
    this.strategy =
      MediaRecorderStrategy.tryCreate(this.stream, warmupMs) ?? new WebAudioWavStrategy(this.stream, warmupMs);

    try {
      // Warm-up delay before capture starts (lets the mic "stabilize").
      // Must be cancellable: if `cancel()` happens during warm-up we abort immediately.
      await new Promise<void>((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const t = window.setTimeout(() => {
          abortController.signal.removeEventListener('abort', onAbort);
          resolve();
        }, warmupMs);

        const onAbort = () => {
          clearTimeout(t);
          abortController.signal.removeEventListener('abort', onAbort);
          reject(new DOMException('Aborted', 'AbortError'));
        };

        abortController.signal.addEventListener('abort', onAbort, { once: true });
      });

      await this.strategy.start();
    } catch (e) {
      this.strategy.dispose();
      this.strategy = null;
      this.releaseStreamOnly();
      this.abortController = null;
      throw e;
    }
  }

  async stop(): Promise<Blob> {
    if (!this.stream || !this.strategy) {
      throw new Error('Not recording');
    }

    try {
      return await this.strategy.stop();
    } finally {
      this.strategy.dispose();
      this.strategy = null;
      this.releaseStreamOnly();
      this.abortController = null;
    }
  }

  cancel(): void {
    this.abortController?.abort();
    this.strategy?.dispose();
    this.strategy = null;
    this.releaseAll();
  }

  private releaseStreamOnly(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private releaseAll(): void {
    this.strategy?.dispose();
    this.strategy = null;
    this.releaseStreamOnly();
    this.abortController = null;
  }
}
