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
  start(): Promise<void>;
  stop(): Promise<Blob>;
  dispose(): void;
}

/**
 * Web capture facade: acquires mic once, then delegates to a concrete strategy
 * ({@link MediaRecorderStrategy} or {@link WebAudioWavStrategy}).
 */
export class WebVoiceRecorder implements IVoiceRecorder {
  private stream: MediaStream | null = null;
  private abortController: AbortController | null = null;
  private strategy: IWebRecordingStrategy | null = null;

  async start(): Promise<void> {
    this.cancel();

    const abortController = new AbortController();
    this.abortController = abortController;

    const constraints: MediaStreamConstraints & { signal?: AbortSignal } = {
      audio: true,
      signal: abortController.signal,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      this.releaseAll();
      throw e;
    }

    if (abortController.signal.aborted) {
      this.releaseAll();
      return;
    }

    this.strategy =
      MediaRecorderStrategy.tryCreate(this.stream) ?? new WebAudioWavStrategy(this.stream);

    try {
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
