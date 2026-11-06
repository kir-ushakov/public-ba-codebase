import {
  markRecorderOpened,
  startupReport,
} from 'src/app/shared/services/pwa/voice-recorder/microphone-startup-probe';

describe('microphone startup probe', () => {
  it('reports open-to-capture timings without a warm-up window', () => {
    markRecorderOpened();
    const opened = performance.now();

    const report = startupReport({
      constraints: 'voice-dsp',
      engine: 'media-recorder',
      outcome: 'recorded',
      acquiredAt: opened + 40,
      getUserMediaMs: 30,
      strategyInitMs: 2,
      startToCaptureMs: 1,
      captureConfirmedAt: opened + 43,
    });

    expect(report.outcome).toBe('recorded');
    expect(report.engine).toBe('media-recorder');
    expect(report.getUserMediaMs).toBe(30);
    expect(report.strategyInitMs).toBe(2);
    expect(report.startToCaptureMs).toBe(1);
    expect(report.openToGetUserMediaMs).toBeGreaterThanOrEqual(0);
    expect(report.openToRecordingMs).toBeGreaterThanOrEqual(0);
    expect(report.attempt).toBeGreaterThan(0);
  });

  it('omits capture confirmation when startup fails and counts the next attempt', () => {
    const first = startupReport({
      constraints: 'fallback',
      engine: null,
      outcome: 'failed',
      acquiredAt: 10,
      getUserMediaMs: 10,
      strategyInitMs: 0,
      startToCaptureMs: null,
      captureConfirmedAt: null,
    });
    const second = startupReport({
      constraints: 'voice-dsp',
      engine: 'media-recorder',
      outcome: 'recorded',
      acquiredAt: 20,
      getUserMediaMs: 5,
      strategyInitMs: 1,
      startToCaptureMs: 0,
      captureConfirmedAt: 21,
    });

    expect(first.startToCaptureMs).toBeNull();
    expect(first.openToRecordingMs).toBeNull();
    expect(second.attempt).toBe(first.attempt + 1);
  });
});
