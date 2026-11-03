import { MediaRecorderStrategy } from 'src/app/shared/services/pwa/voice-recorder/strategies/media-recorder.strategy';
import { WebAudioWavStrategy } from 'src/app/shared/services/pwa/voice-recorder/strategies/web-audio-wav.strategy';
import { WebVoiceRecorder } from 'src/app/shared/services/pwa/voice-recorder/impl/web-voice-recorder';

type Listener = () => void;

class FakeMediaRecorder {
  static latest: FakeMediaRecorder | null = null;
  static deferStart = false;
  static failStart = false;

  state = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor() {
    FakeMediaRecorder.latest = this;
  }

  static isTypeSupported(type: string): boolean {
    return type.startsWith('audio/webm');
  }

  start = jest.fn((): void => {
    if (FakeMediaRecorder.failStart) {
      throw new Error('cannot start');
    }
    this.ondataavailable?.({ data: new Blob(['hello'], { type: this.mimeType }) });
    this.state = 'recording';
    if (!FakeMediaRecorder.deferStart) {
      this.emit('start');
    }
  });

  stop = jest.fn((): void => {
    this.ondataavailable?.({ data: new Blob(['tail'], { type: this.mimeType }) });
    this.state = 'inactive';
    this.onstop?.();
  });

  pause = jest.fn((): void => {
    this.state = 'paused';
  });

  resume = jest.fn((): void => {
    this.state = 'recording';
  });

  addEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    this.listeners.get(type)?.forEach(listener => listener());
  }
}

class FakeAudioContext {
  static closed = 0;

  createMediaStreamSource(): { connect: () => void } {
    return { connect() {} };
  }

  createAnalyser(): {
    fftSize: number;
    frequencyBinCount: number;
    connect: () => void;
    getByteTimeDomainData: () => void;
    getByteFrequencyData: () => void;
  } {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      connect() {},
      getByteTimeDomainData() {},
      getByteFrequencyData() {},
    };
  }

  close(): Promise<void> {
    FakeAudioContext.closed += 1;
    return Promise.resolve();
  }
}

describe('web recording startup', () => {
  const track = {
    stop: jest.fn(),
    addEventListener: jest.fn(),
  };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  };
  let getUserMedia: jest.Mock;

  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    FakeMediaRecorder.latest = null;
    FakeMediaRecorder.deferStart = false;
    FakeMediaRecorder.failStart = false;
    FakeAudioContext.closed = 0;
    track.stop.mockClear();
    getUserMedia = jest.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    (globalThis as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder =
      FakeMediaRecorder as unknown as typeof MediaRecorder;
    (globalThis as { AudioContext?: typeof AudioContext }).AudioContext =
      FakeAudioContext as unknown as typeof AudioContext;
  });

  it('starts MediaRecorder without a fixed delay and keeps the first chunk', async () => {
    jest.useFakeTimers();
    try {
      const recorder = new WebVoiceRecorder();
      const pending = recorder.start();
      await Promise.resolve();
      await Promise.resolve();

      expect(FakeMediaRecorder.latest?.start).toHaveBeenCalledWith(250);
      expect(jest.getTimerCount()).toBe(0);
      await pending;

      const blob = await recorder.stop();

      expect(blob.type).toContain('audio/webm');
      expect(blob.size).toBe('hello'.length + 'tail'.length);
      expect(track.stop).toHaveBeenCalled();
      expect(FakeAudioContext.closed).toBeGreaterThan(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not confirm capture until the recorder start event', async () => {
    FakeMediaRecorder.deferStart = true;
    const created = MediaRecorderStrategy.tryCreate(stream as unknown as MediaStream);

    expect(created).not.toBeNull();
    const pending = created!.start();
    let confirmed = false;
    void pending.then(() => {
      confirmed = true;
    });
    await Promise.resolve();

    expect(confirmed).toBe(false);

    FakeMediaRecorder.latest?.emit('start');
    await pending;
    expect(confirmed).toBe(true);
  });

  it('keeps pause and resume after capture has started', async () => {
    const recorder = new WebVoiceRecorder();

    await recorder.start();
    await recorder.pause();
    await recorder.resume();

    expect(FakeMediaRecorder.latest?.pause).toHaveBeenCalled();
    expect(FakeMediaRecorder.latest?.resume).toHaveBeenCalled();
    await recorder.stop();
  });

  it('asks for voice-processing constraints and one channel', async () => {
    const recorder = new WebVoiceRecorder();

    await recorder.start();

    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      }),
    );
    await recorder.stop();
  });

  it('releases the microphone when startup fails', async () => {
    FakeMediaRecorder.failStart = true;
    const recorder = new WebVoiceRecorder();

    await expect(recorder.start()).rejects.toThrow('cannot start');

    expect(track.stop).toHaveBeenCalled();
    expect(recorder.engine).toBeNull();
  });

  it('cancels an in-flight capture request and does not start the recorder afterwards', async () => {
    let releasePermission: ((value: typeof stream) => void) | undefined;
    getUserMedia.mockImplementation(
      (constraints: { signal?: AbortSignal }) =>
        new Promise(resolve => {
          constraints.signal?.addEventListener('abort', () => {
            resolve = () => undefined;
          });
          releasePermission = resolve;
        }),
    );
    const recorder = new WebVoiceRecorder();
    const pending = recorder.start();

    recorder.cancel();
    releasePermission?.(stream);

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeMediaRecorder.latest).toBeNull();
  });

  it('stops a recorder that is cancelled while waiting for the start event', async () => {
    FakeMediaRecorder.deferStart = true;
    const recorder = new WebVoiceRecorder();
    const pending = recorder.start();
    await Promise.resolve();
    await Promise.resolve();

    expect(FakeMediaRecorder.latest?.start).toHaveBeenCalled();
    recorder.cancel();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(track.stop).toHaveBeenCalled();
  });

  it('keeps the first WebAudio frame and aborts if capture is cancelled while loading', async () => {
    let releaseModule: (() => void) | undefined;
    let deferModule = true;
    let capturePort: { onmessage: ((event: MessageEvent<Float32Array>) => void) | null } | null =
      null;

    class FakeWorkletNode {
      port = { onmessage: null as ((event: MessageEvent<Float32Array>) => void) | null };
      connect(): void {}
      disconnect(): void {}

      constructor() {
        capturePort = this.port;
      }
    }

    class WavAudioContext {
      sampleRate = 48_000;
      audioWorklet = {
        addModule: (): Promise<void> =>
          deferModule
            ? new Promise<void>(resolve => {
                releaseModule = resolve;
              })
            : Promise.resolve(),
      };
      createMediaStreamSource(): { connect: () => void; disconnect: () => void } {
        return { connect() {}, disconnect() {} };
      }
      createGain(): {
        gain: { value: number };
        connect: () => void;
        disconnect: () => void;
      } {
        return { gain: { value: 0 }, connect() {}, disconnect() {} };
      }
      resume(): Promise<void> {
        return Promise.resolve();
      }
      close(): Promise<void> {
        return Promise.resolve();
      }
    }

    URL.createObjectURL = () => 'blob:capture';
    URL.revokeObjectURL = () => undefined;
    (globalThis as { AudioContext?: typeof AudioContext }).AudioContext =
      WavAudioContext as unknown as typeof AudioContext;
    (globalThis as { AudioWorkletNode?: typeof AudioWorkletNode }).AudioWorkletNode =
      FakeWorkletNode as unknown as typeof AudioWorkletNode;

    const cancelled = new WebAudioWavStrategy(stream as unknown as MediaStream);
    const cancelledStart = cancelled.start();
    await Promise.resolve();
    cancelled.dispose();
    releaseModule?.();
    await expect(cancelledStart).rejects.toMatchObject({ name: 'AbortError' });

    deferModule = false;
    const strategy = new WebAudioWavStrategy(stream as unknown as MediaStream);
    await strategy.start();
    capturePort?.onmessage?.(
      new MessageEvent('message', { data: new Float32Array([0.25, -0.25]) }),
    );
    const blob = await strategy.stop();

    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44);
  });
});
