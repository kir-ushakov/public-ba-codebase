import type { IVoiceRecorder } from '../voice-recorder.interface';
import { logStartup } from '../microphone-startup-probe';
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
  private stream: MediaStream | null = null;
  private abortController: AbortController | null = null;
  private ignoreTrackEnd = false;
  private unexpectedEnd: (() => void) | null = null;
  private strategy: IWebRecordingStrategy | null = null;
  private levelContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelSamples: Uint8Array | null = null;
  private frequencySamples: Uint8Array | null = null;
  private startupMark: {
    constraints: 'voice-dsp' | 'fallback';
    acquiredAt: number;
    getUserMediaMs: number;
  } | null = null;

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
      const captureRequestedAt = performance.now();
      let constraints: 'voice-dsp' | 'fallback' = 'voice-dsp';
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(preferred);
      } catch (error) {
        if (
          abortController.signal.aborted ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          throw error;
        }
        constraints = 'fallback';
        const fallback: MediaStreamConstraints & { signal?: AbortSignal } = {
          audio: true,
          signal: abortController.signal,
        };
        this.stream = await navigator.mediaDevices.getUserMedia(fallback);
      }
      const acquiredAt = performance.now();
      this.startupMark = {
        constraints,
        acquiredAt,
        getUserMediaMs: acquiredAt - captureRequestedAt,
      };
    } catch (e) {
      this.releaseAll();
      throw e;
    }

    const stream = this.stream;
    if (!stream || abortController.signal.aborted) {
      this.releaseAll();
      throw new DOMException('Aborted', 'AbortError');
    }

    this.watchStream(stream);

    // Prefer MediaRecorder. Fall back to WebAudio→WAV when it cannot be constructed.
    const strategyInitStartedAt = performance.now();
    const strategy = MediaRecorderStrategy.tryCreate(stream) ?? new WebAudioWavStrategy(stream);
    this.strategy = strategy;
    const strategyInitMs = performance.now() - strategyInitStartedAt;
    this.startLevelMeter(stream);

    const startup = this.startupMark;
    const engine = strategy.engine;
    try {
      const startInvokedAt = performance.now();
      await this.awaitCaptureStart(abortController.signal);
      if (abortController.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const confirmedAt = performance.now();
      this.logStartup(
        startup,
        engine,
        'recorded',
        strategyInitMs,
        confirmedAt - startInvokedAt,
        confirmedAt,
      );
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      this.logStartup(startup, engine, aborted ? 'aborted' : 'failed', strategyInitMs, null, null);
      this.strategy?.dispose();
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

  observeUnexpectedEnd(handler: () => void): void {
    this.unexpectedEnd = handler;
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

  private watchStream(stream: MediaStream): void {
    this.ignoreTrackEnd = false;
    for (const track of stream.getAudioTracks()) {
      track.addEventListener('ended', () => this.onTrackEnded(), { once: true });
    }
  }

  private onTrackEnded(): void {
    if (this.ignoreTrackEnd) {
      return;
    }
    this.ignoreTrackEnd = true;
    this.abortController?.abort();
    this.strategy?.dispose();
    this.strategy = null;
    this.releaseStreamOnly();
    this.releaseLevelMeter();
    this.abortController = null;
    this.unexpectedEnd?.();
  }

  private releaseStreamOnly(): void {
    this.ignoreTrackEnd = true;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  private awaitCaptureStart(signal: AbortSignal): Promise<void> {
    const strategy = this.strategy;
    if (!strategy || signal.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    const started = strategy.start();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: unknown): void => {
        if (settled) {
          return;
        }
        settled = true;
        signal.removeEventListener('abort', onAbort);
        if (error) {
          reject(error instanceof Error ? error : new Error('Failed to start recorder'));
        } else {
          resolve();
        }
      };
      const onAbort = (): void => {
        finish(new DOMException('Aborted', 'AbortError'));
      };

      signal.addEventListener('abort', onAbort, { once: true });
      started.then(
        () => finish(),
        (error: unknown) => finish(error),
      );
    });
  }

  private logStartup(
    mark: {
      constraints: 'voice-dsp' | 'fallback';
      acquiredAt: number;
      getUserMediaMs: number;
    } | null,
    engine: string | null,
    outcome: 'recorded' | 'aborted' | 'failed',
    strategyInitMs: number,
    startToCaptureMs: number | null,
    captureConfirmedAt: number | null,
  ): void {
    if (!mark) {
      return;
    }
    logStartup({
      constraints: mark.constraints,
      engine,
      outcome,
      acquiredAt: mark.acquiredAt,
      getUserMediaMs: mark.getUserMediaMs,
      strategyInitMs,
      startToCaptureMs,
      captureConfirmedAt,
    });
    this.startupMark = null;
  }

  private releaseAll(): void {
    this.startupMark = null;
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
