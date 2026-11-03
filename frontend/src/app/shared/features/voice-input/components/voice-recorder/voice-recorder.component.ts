import { Component, DestroyRef, inject, output, signal, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MicIconComponent } from './mic-icon/mic-icon.component';
import { ProgressRingComponent } from './progress-ring/progress-ring.component';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
import { VoiceRecordingFacade } from 'src/app/shared/features/voice-input/voice-recording.facade';
import { microphoneFailureMessage } from 'src/app/shared/features/voice-input/microphone-failure-message.function';
import { markRecorderOpened } from 'src/app/shared/services/pwa/voice-recorder/microphone-startup-probe';
import { TaskConst } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';

export type VoiceRecorderMode = 'title' | 'attachment';

export type VoiceRecorderDialogData = {
  mode?: VoiceRecorderMode;
};

export type SavedVoiceRecording = {
  blob: Blob;
  durationMs: number;
};

const TITLE_LIMIT_MS = 12_000;
const WAVEFORM_BARS = 16;
const MIN_BAR_LEVEL = 0.08;
const MEANINGFUL_CAPTURE_MS = 300;

/**
 * Fullscreen recorder for a task title (12 seconds, then transcribe) or an audio attachment
 * (pause, save, no transcription).
 */
@Component({
  selector: 'ba-voice-recorder',
  imports: [CommonModule, MatIconModule, MatButtonModule, MicIconComponent, ProgressRingComponent],
  templateUrl: './voice-recorder.component.html',
  styleUrl: './voice-recorder.component.scss',
  host: {
    '[class.is-attachment]': 'mode === "attachment"',
  },
})
export class VoiceRecorderComponent {
  @ViewChild(ProgressRingComponent) private progressRing?: ProgressRingComponent;

  readonly stopped = output<void>();
  readonly canceled = output<void>();
  readonly audioReady = output<SavedVoiceRecording>();

  readonly dialogRef = inject(MatDialogRef<VoiceRecorderComponent>);
  readonly mode: VoiceRecorderMode =
    inject<VoiceRecorderDialogData | null>(MAT_DIALOG_DATA, { optional: true })?.mode ?? 'title';
  readonly titleLimitSeconds = TITLE_LIMIT_MS / 1000;
  readonly recordingDuration = TITLE_LIMIT_MS;
  readonly phase = signal<'preparing' | 'recording' | 'paused' | 'saving' | 'error'>('preparing');
  readonly errorMessage = signal('');
  readonly elapsedLabel = signal(this.mode === 'title' ? '0 / 12 s' : '00:00');
  readonly bars = signal<number[]>(Array.from({ length: WAVEFORM_BARS }, () => MIN_BAR_LEVEL));
  readonly meterLive = signal(false);
  readonly confirmingCancel = signal(false);
  readonly saveBlocked = signal(false);

  private readonly store = inject(Store);
  private readonly recorder = inject(VoiceRecordingFacade);
  private readonly destroyRef = inject(DestroyRef);

  private recordingTimeout: number | null = null;
  private clockTimer: number | null = null;
  private attempt = 0;
  private releaseOnDestroy = true;
  private elapsedMs = 0;
  private lastTick = 0;
  private isFinalized = false;
  private endedDuringPrepare = false;
  private pendingBlob: Blob | null = null;

  constructor() {
    this.recorder.whenCaptureEnds(() => this.onCaptureEnded());
    this.destroyRef.onDestroy(() => {
      this.stopClock();
      if (this.releaseOnDestroy) {
        this.recorder.cancelRecording();
      }
    });
  }

  ngAfterViewInit(): void {
    void this.beginSession();
  }

  micColor(): string {
    return this.phase() === 'recording' ? 'var(--color-icon-active)' : 'var(--color-icon-default)';
  }

  canSave(): boolean {
    return (
      this.phase() !== 'preparing' &&
      this.phase() !== 'saving' &&
      !this.saveBlocked() &&
      (this.phase() !== 'error' || this.pendingBlob !== null)
    );
  }

  retry(): void {
    if (this.phase() !== 'error' || this.isFinalized) {
      return;
    }
    void this.beginSession();
  }

  apply(): void {
    if (
      this.confirmingCancel() ||
      this.saveBlocked() ||
      this.phase() === 'preparing' ||
      this.phase() === 'saving' ||
      this.isFinalized
    ) {
      return;
    }
    if (this.mode === 'title') {
      this.releaseOnDestroy = false;
      this.stopped.emit();
      this.finalize();
      return;
    }
    void this.saveAttachment();
  }

  cancel(): void {
    if (this.isFinalized || this.phase() === 'saving') {
      return;
    }
    if (this.mode === 'attachment' && this.hasCapturableAudio()) {
      this.confirmingCancel.set(true);
      return;
    }
    this.discard();
  }

  keepRecording(): void {
    this.confirmingCancel.set(false);
  }

  discardRecording(): void {
    this.discard();
  }

  async togglePause(): Promise<void> {
    if (this.mode !== 'attachment' || this.isFinalized) {
      return;
    }
    try {
      if (this.phase() === 'paused') {
        await this.recorder.resumeRecording();
        this.phase.set('recording');
        this.lastTick = performance.now();
        return;
      }
      if (this.phase() !== 'recording') {
        return;
      }
      await this.recorder.pauseRecording();
      this.phase.set('paused');
    } catch {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not pause the recording.'));
    }
  }

  private async beginSession(): Promise<void> {
    const attempt = ++this.attempt;
    markRecorderOpened();
    this.endedDuringPrepare = false;
    this.errorMessage.set('');
    this.phase.set('preparing');
    try {
      await firstValueFrom(this.store.dispatch(new VoiceInputAction.StartRecording()));
      if (attempt !== this.attempt || this.isFinalized) {
        return;
      }
      if (this.mode === 'attachment' && this.recorder.engine === 'web-audio-wav') {
        this.recorder.cancelRecording();
        this.store.dispatch(
          new AppAction.ShowErrorInUI(
            'This browser records uncompressed audio. Long recordings are not available.',
          ),
        );
        this.releaseOnDestroy = false;
        this.dialogRef.close();
        return;
      }
      if (!this.recorder.isRecording) {
        this.phase.set('error');
        this.errorMessage.set(
          this.endedDuringPrepare
            ? 'The microphone disconnected.'
            : 'The recorder could not be started.',
        );
        return;
      }
      this.phase.set('recording');
      this.startClock();
      if (this.mode === 'title') {
        this.progressRing?.start();
        this.recordingTimeout = window.setTimeout(() => this.apply(), TITLE_LIMIT_MS);
      }
    } catch (err) {
      if (attempt !== this.attempt || this.isFinalized) {
        return;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      this.recorder.cancelRecording();
      this.phase.set('error');
      this.errorMessage.set(microphoneFailureMessage(err));
    }
  }

  private onCaptureEnded(): void {
    if (this.isFinalized || this.phase() === 'saving') {
      return;
    }
    if (this.phase() === 'preparing') {
      this.endedDuringPrepare = true;
      return;
    }
    this.stopClock();
    this.progressRing?.stop();
    if (this.recordingTimeout !== null) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    this.phase.set('error');
    this.errorMessage.set('The microphone disconnected.');
  }

  private async saveAttachment(): Promise<void> {
    this.phase.set('saving');
    this.stopClock();
    try {
      const blob = this.pendingBlob ?? (await this.recorder.stopRecording());
      this.pendingBlob = blob;
      if (blob.size > TaskConst.AUDIO_MAX_BYTES) {
        this.saveBlocked.set(true);
        this.phase.set('error');
        this.store.dispatch(
          new AppAction.ShowErrorInUI('The recording is too large to save.', 'Not saved'),
        );
        return;
      }
      this.releaseOnDestroy = false;
      this.audioReady.emit({
        blob,
        durationMs: Math.max(0, Math.round(this.elapsedMs)),
      });
      this.finalize();
    } catch {
      this.phase.set('error');
      this.store.dispatch(
        new AppAction.ShowErrorInUI(
          'Could not save the recording. It is still here if you want to try again.',
          'Not saved',
        ),
      );
    }
  }

  private startClock(): void {
    this.lastTick = performance.now();
    if (this.mode === 'attachment') {
      this.readLevels();
    }
    this.clockTimer = window.setInterval(() => this.tick(), 200);
  }

  private tick(): void {
    if (this.phase() !== 'recording') {
      return;
    }
    const now = performance.now();
    this.elapsedMs += now - this.lastTick;
    this.lastTick = now;
    if (this.mode === 'title') {
      this.elapsedLabel.set(this.formatTitle());
      return;
    }
    this.elapsedLabel.set(this.formatElapsed());
    this.readLevels();
    const bytes = this.recorder.capturedBytes();
    if (bytes > 0 && bytes >= TaskConst.AUDIO_RECORDING_STOP_BYTES) {
      this.apply();
    }
  }

  private formatTitle(): string {
    const seconds = Math.min(this.titleLimitSeconds, Math.floor(this.elapsedMs / 1000));
    return `${seconds} / ${this.titleLimitSeconds} s`;
  }

  private formatElapsed(): string {
    const total = Math.floor(this.elapsedMs / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  private readLevels(): void {
    const levels = this.recorder.levels(WAVEFORM_BARS);
    if (levels.length !== WAVEFORM_BARS) {
      return;
    }
    this.meterLive.set(true);
    this.bars.set(levels.map(value => Math.max(MIN_BAR_LEVEL, Math.min(1, value))));
  }

  private hasCapturableAudio(): boolean {
    return (
      this.pendingBlob !== null ||
      this.elapsedMs >= MEANINGFUL_CAPTURE_MS ||
      this.recorder.capturedBytes() > 0
    );
  }

  private discard(): void {
    this.confirmingCancel.set(false);
    if (this.mode === 'attachment' && !this.pendingBlob) {
      this.recorder.cancelRecording();
    }
    this.pendingBlob = null;
    this.canceled.emit();
    this.finalize();
  }

  private stopClock(): void {
    if (this.clockTimer !== null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  private finalize(): void {
    if (this.isFinalized) {
      return;
    }
    this.isFinalized = true;
    this.progressRing?.stop();
    this.stopClock();
    if (this.recordingTimeout !== null) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    this.dialogRef.close();
  }
}
