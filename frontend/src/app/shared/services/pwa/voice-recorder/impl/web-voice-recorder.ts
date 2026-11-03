import type { IVoiceRecorder } from '../voice-recorder.interface';
import { MediaRecorderStrategy } from '../strategies/media-recorder.strategy';
import { WebAudioWavStrategy } from '../strategies/web-audio-wav.strategy';

export type VoiceRecorderEngine = 'media-recorder' | 'web-audio-wav';

/**
 * #VIWAI_FE_WEB-VOICE-RECORDER:
 *
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
  pause(): Promise<void>;
  resume(): Promise<void>;
  capturedBytes(): number;
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

const VOICE_BINS_PER_BAR = 3;
const FREQUENCY_BYTE_MAX = 255;

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
  private levelContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelSamples: Uint8Array | null = null;
  private frequencySamples: Uint8Array | null = null;

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
      MediaRecorderStrategy.tryCreate(this.stream, warmupMs) ??
      new WebAudioWavStrategy(this.stream, warmupMs);
    this.startLevelMeter(this.stream);

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

        const onAbort = (): void => {
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
      this.releaseLevelMeter();
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
      this.releaseLevelMeter();
      this.abortController = null;
    }
  }

  cancel(): void {
    this.abortController?.abort();
    this.strategy?.dispose();
    this.strategy = null;
    this.releaseAll();
  }

  get engine(): VoiceRecorderEngine | null {
    return this.strategy?.engine ?? null;
  }

  async pause(): Promise<void> {
    if (!this.strategy) {
      throw new Error('Not recording');
    }
    await this.strategy.pause();
  }

  async resume(): Promise<void> {
    if (!this.strategy) {
      throw new Error('Not recording');
    }
    await this.strategy.resume();
  }

  capturedBytes(): number {
    return this.strategy?.capturedBytes() ?? 0;
  }

  level(): number {
    const analyser = this.analyser;
    const samples = this.levelSamples;
    if (!analyser || !samples) {
      return 0;
    }
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const value of samples) {
      const centered = (value - 128) / 128;
      sum += centered * centered;
    }
    return Math.min(1, Math.sqrt(sum / samples.length) * 4);
  }

  levels(barCount: number): number[] {
    const analyser = this.analyser;
    if (!analyser || barCount <= 0) {
      return [];
    }
    if (!this.frequencySamples || this.frequencySamples.length !== analyser.frequencyBinCount) {
      this.frequencySamples = new Uint8Array(analyser.frequencyBinCount);
    }
    const samples = this.frequencySamples;
    analyser.getByteFrequencyData(samples);
    const voiceBins = Math.min(samples.length, barCount * VOICE_BINS_PER_BAR);
    const width = Math.max(1, Math.floor(voiceBins / barCount));
    const bars: number[] = [];
    for (let bar = 0; bar < barCount; bar += 1) {
      const start = bar * width;
      let sum = 0;
      for (let bin = 0; bin < width; bin += 1) {
        sum += samples[start + bin] ?? 0;
      }
      bars.push(Math.min(1, sum / width / FREQUENCY_BYTE_MAX));
    }
    return bars;
  }

  private releaseStreamOnly(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private releaseAll(): void {
    this.strategy?.dispose();
    this.strategy = null;
    this.releaseStreamOnly();
    this.releaseLevelMeter();
    this.abortController = null;
  }

  private startLevelMeter(stream: MediaStream): void {
    this.releaseLevelMeter();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    this.levelContext = context;
    this.analyser = analyser;
    this.levelSamples = new Uint8Array(analyser.fftSize);
  }

  private releaseLevelMeter(): void {
    void this.levelContext?.close();
    this.levelContext = null;
    this.analyser = null;
    this.levelSamples = null;
    this.frequencySamples = null;
  }
}
