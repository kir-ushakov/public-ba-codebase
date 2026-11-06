import { environment } from 'src/environments/environment';

export type StartupProbeReport = {
  platform: string;
  constraints: 'voice-dsp' | 'fallback';
  engine: string | null;
  outcome: 'recorded' | 'aborted' | 'failed';
  attempt: number;
  openToGetUserMediaMs: number | null;
  getUserMediaMs: number;
  strategyInitMs: number;
  startToCaptureMs: number | null;
  openToRecordingMs: number | null;
};

type ProbeEnvironment = {
  production: boolean;
  benchmark?: boolean;
};

let openedAt: number | null = null;
let attempt = 0;

export function isStartupProbeEnabled(): boolean {
  const env = environment as ProbeEnvironment;
  return !env.production || env.benchmark === true;
}

/** Marks the moment the recorder screen starts a capture attempt. */
export function markRecorderOpened(): void {
  if (!isStartupProbeEnabled()) {
    return;
  }
  openedAt = performance.now();
}

export function startupReport(input: {
  constraints: 'voice-dsp' | 'fallback';
  engine: string | null;
  outcome: StartupProbeReport['outcome'];
  acquiredAt: number;
  getUserMediaMs: number;
  strategyInitMs: number;
  startToCaptureMs: number | null;
  captureConfirmedAt: number | null;
}): StartupProbeReport {
  attempt += 1;
  const opened = openedAt;
  return {
    platform: platformLabel(),
    constraints: input.constraints,
    engine: input.engine,
    outcome: input.outcome,
    attempt,
    openToGetUserMediaMs: opened === null ? null : Math.round(input.acquiredAt - opened),
    getUserMediaMs: Math.round(input.getUserMediaMs),
    strategyInitMs: Math.round(input.strategyInitMs),
    startToCaptureMs: input.startToCaptureMs === null ? null : Math.round(input.startToCaptureMs),
    openToRecordingMs:
      opened === null || input.captureConfirmedAt === null
        ? null
        : Math.round(input.captureConfirmedAt - opened),
  };
}

export function logStartup(input: Parameters<typeof startupReport>[0]): void {
  if (!isStartupProbeEnabled()) {
    return;
  }
  console.info('[mic-startup]', startupReport(input));
}

function platformLabel(): string {
  const agent = navigator.userAgent;
  if (/Android/i.test(agent)) {
    return 'android';
  }
  if (/iPhone|iPad|iPod/i.test(agent)) {
    return 'ios';
  }
  if (/Windows/i.test(agent)) {
    return 'windows';
  }
  if (/Mac OS/i.test(agent)) {
    return 'mac';
  }
  return 'other';
}
