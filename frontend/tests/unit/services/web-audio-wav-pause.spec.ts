import { WebAudioWavStrategy } from 'src/app/shared/services/pwa/voice-recorder/strategies/web-audio-wav.strategy';

describe('WebAudioWavStrategy pause', () => {
  it('does not append samples while paused', async () => {
    const strategy = new WebAudioWavStrategy({} as MediaStream, 0);
    (strategy as unknown as { active: boolean }).active = true;

    const chunk = new Float32Array(10);
    strategy.ingest(chunk);
    const captured = strategy.capturedBytes();

    await strategy.pause();
    strategy.ingest(chunk);
    expect(strategy.capturedBytes()).toBe(captured);

    await strategy.resume();
    strategy.ingest(chunk);
    expect(strategy.capturedBytes()).toBe(captured + chunk.length * 2);
  });
});
