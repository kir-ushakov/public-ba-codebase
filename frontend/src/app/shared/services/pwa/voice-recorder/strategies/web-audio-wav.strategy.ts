import type { IWebRecordingStrategy, VoiceRecorderEngine } from '../impl/web-voice-recorder';
import { logAndPreviewRecordedBlob } from '../log-and-preview-recorded-blob';

/** Hard cap (~10 min mono @48kHz) — avoids unbounded RAM if the tab is left recording. */
const MAX_PCM_SAMPLES = 48_000 * 600;

function createAudioContext(AudioCtx: typeof AudioContext): AudioContext {
  // Prefer the device/browser default sample rate. Forcing a non-native rate can trigger
  // resampling and occasionally audible glitches on some platforms.
  return new AudioCtx();
}

export class WebAudioWavStrategy implements IWebRecordingStrategy {
  readonly engine: VoiceRecorderEngine = 'web-audio-wav';
  /** Audio to discard at the beginning; UI countdown starts after this period. */
  readonly warmupMs: number;

  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private captureNode: AudioNode | null = null;
  private silenceGain: GainNode | null = null;
  private pcmBuffer: Float32Array | null = null;
  private pcmSampleCount = 0;
  private pcmOverflow = false;
  /**
   * Ignore late worklet/script callbacks after stop/dispose.
   * WebAudio can deliver a final `onmessage`/`onaudioprocess` after we disconnect/close.
   */
  private active = false;
  /** Remaining samples to drop from the beginning (derived from `warmupMs` and sampleRate). */
  private discardRemainingSamples = 0;

  constructor(
    private readonly stream: MediaStream,
    warmupMs: number,
  ) {
    this.warmupMs = Math.max(0, warmupMs);
  }

  async start(): Promise<void> {
    this.active = false;
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      throw new Error('WebAudio is not supported');
    }

    this.audioContext = createAudioContext(AudioCtx);
    // Best-effort: some browsers keep AudioContext suspended until a user gesture.
    // If resume is blocked, we continue; capture may still work via the mic stream.
    try {
      await this.audioContext.resume();
    } catch {
      /* ignore */
    }
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.pcmBuffer = null;
    this.pcmSampleCount = 0;
    this.pcmOverflow = false;
    this.discardRemainingSamples = 0;

    const ctx = this.audioContext;
    // Convert warm-up milliseconds → samples, so we can drop exact PCM samples.
    this.discardRemainingSamples = Math.round((ctx.sampleRate * this.warmupMs) / 1000);

    if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
      const workletCode = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs && inputs[0] && inputs[0][0];
    if (input && input.length) {
      // Copy: render quantum buffers may be reused after \`process\` returns.
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.port.postMessage(copy);
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCaptureProcessor);
`;

      const moduleUrl = URL.createObjectURL(
        new Blob([workletCode], { type: 'text/javascript' }),
      );

      try {
        await ctx.audioWorklet.addModule(moduleUrl);
      } finally {
        const url = moduleUrl;
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }

      const node = new AudioWorkletNode(ctx, 'pcm-capture');
      node.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!this.active) {
          return;
        }
        const input = event.data;
        this.appendPcmCopy(input);
      };

      this.silenceGain = ctx.createGain();
      this.silenceGain.gain.value = 0;

      this.captureNode = node;
      this.source.connect(node);
      node.connect(this.silenceGain);
      this.silenceGain.connect(ctx.destination);
      this.active = true;
      return;
    }

    const processor = (ctx as unknown as { createScriptProcessor?: Function }).createScriptProcessor?.call(
      ctx,
      4096,
      1,
      1,
    ) as AudioNode | undefined;

    if (!processor) {
      throw new Error('No supported WebAudio capture node available');
    }

    (processor as unknown as { onaudioprocess?: (e: AudioProcessingEvent) => void }).onaudioprocess =
      e => {
        if (!this.active) {
          return;
        }
        const input = e.inputBuffer.getChannelData(0);
        this.appendPcmCopy(input);
      };

    this.captureNode = processor;
    this.silenceGain = ctx.createGain();
    this.silenceGain.gain.value = 0;
    this.source.connect(processor);
    processor.connect(this.silenceGain);
    this.silenceGain.connect(ctx.destination);
    this.active = true;
  }

  async stop(): Promise<Blob> {
    const ctx = this.audioContext;
    const rate = ctx?.sampleRate;
    if (!rate) {
      this.disposeGraph();
      throw new Error('AudioContext not ready');
    }

    if (this.pcmOverflow) {
      this.disposeGraph();
      throw new Error(
        `Recording exceeded maximum length (~${Math.floor(MAX_PCM_SAMPLES / rate)}s at ${rate}Hz); stop earlier or raise MAX_PCM_SAMPLES`,
      );
    }

    const blob = this.encodeWavFromBuffer(this.pcmBuffer, this.pcmSampleCount, rate);
    const audioDurationSec =
      this.pcmSampleCount > 0 ? Math.round((this.pcmSampleCount / rate) * 1000) / 1000 : 0;
    logAndPreviewRecordedBlob(blob, {
      engine: 'web-audio-wav',
      sampleRate: rate,
      pcmSamples: this.pcmSampleCount,
      audioDurationSec,
    });
    this.disposeGraph();
    return blob;
  }

  dispose(): void {
    this.disposeGraph();
  }

  private disposeGraph(): void {
    this.active = false;
    this.source?.disconnect();
    this.captureNode?.disconnect();
    this.silenceGain?.disconnect();

    void this.audioContext?.close();

    this.source = null;
    this.captureNode = null;
    this.silenceGain = null;
    this.audioContext = null;
    this.pcmBuffer = null;
    this.pcmSampleCount = 0;
    this.pcmOverflow = false;
    this.discardRemainingSamples = 0;
  }

  private appendPcmCopy(chunk: Float32Array): void {
    if (this.pcmOverflow) {
      return;
    }

    // Drop warm-up samples (do NOT include them in the final WAV).
    let start = 0;
    if (this.discardRemainingSamples > 0) {
      const toDrop = Math.min(this.discardRemainingSamples, chunk.length);
      this.discardRemainingSamples -= toDrop;
      start = toDrop;
      if (start >= chunk.length) {
        return;
      }
    }
    const usable = start > 0 ? chunk.subarray(start) : chunk;

    const nextCount = this.pcmSampleCount + usable.length;
    if (nextCount > MAX_PCM_SAMPLES) {
      this.pcmOverflow = true;
      return;
    }
    this.ensurePcmCapacity(nextCount);
    this.pcmBuffer!.set(usable, this.pcmSampleCount);
    this.pcmSampleCount = nextCount;
  }

  private ensurePcmCapacity(minLength: number): void {
    if (!this.pcmBuffer) {
      const initial = Math.max(minLength, 16_384);
      this.pcmBuffer = new Float32Array(initial);
      return;
    }
    if (minLength <= this.pcmBuffer.length) {
      return;
    }
    const grown = Math.max(minLength, Math.floor(this.pcmBuffer.length * 1.5));
    const next = new Float32Array(grown);
    next.set(this.pcmBuffer.subarray(0, this.pcmSampleCount));
    this.pcmBuffer = next;
  }

  private encodeWavFromBuffer(samples: Float32Array | null, length: number, sampleRate: number): Blob {
    const merged =
      samples && length > 0 ? samples.subarray(0, length) : new Float32Array(0);

    const buffer = new ArrayBuffer(44 + merged.length * 2);
    const view = new DataView(buffer);

    const write = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    write(0, 'RIFF');
    view.setUint32(4, 36 + merged.length * 2, true);
    write(8, 'WAVE');

    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    write(36, 'data');
    view.setUint32(40, merged.length * 2, true);

    let offset = 44;
    for (let i = 0; i < merged.length; i++) {
      const sample = merged[i]!;
      const s = sample < -1 ? -1 : sample > 1 ? 1 : sample;
      view.setInt16(offset, Math.round(s * 0x7fff), true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }
}
