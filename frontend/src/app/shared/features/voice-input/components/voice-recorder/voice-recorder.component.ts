import { Component, inject, output, signal, ViewChild } from '@angular/core';
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
const NATIVE_RECORDING_LIMIT_MS = 15 * 60 * 1000;
const WAVEFORM_BARS = 16;

/**
 * Fullscreen recorder for a task title (12 seconds, then transcribe) or an audio attachment
 * (pause, save, no transcription).
 */
@Component({
  selector: 'ba-voice-recorder',
  imports: [CommonModule, MatIconModule, MatButtonModule, MicIconComponent, ProgressRingComponent],
  templateUrl: './voice-recorder.component.html',
  styleUrl: './voice-recorder.component.scss',
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
  readonly phase = signal<'starting' | 'recording' | 'paused' | 'saving'>('starting');
  readonly elapsedLabel = signal(this.mode === 'title' ? '0 / 12 s' : '00:00');
  readonly bars = signal<number[]>(Array.from({ length: WAVEFORM_BARS }, () => 0.08));

  private readonly store = inject(Store);
  private readonly recorder = inject(VoiceRecordingFacade);

  private recordingTimeout: number | null = null;
  private clockTimer: number | null = null;
  private elapsedMs = 0;
  private lastTick = 0;
  private isFinalized = false;

  ngAfterViewInit(): void {
    void this.beginSessionAfterMicReady();
  }

  apply(): void {
    if (this.phase() === 'starting' || this.phase() === 'saving' || this.isFinalized) {
      return;
    }
    if (this.mode === 'title') {
      this.stopped.emit();
      this.finalize();
      return;
    }
    void this.saveAttachment();
  }

  cancel(): void {
    if (this.isFinalized) {
      return;
    }
    this.canceled.emit();
    this.finalize();
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
      this.bars.set(Array.from({ length: WAVEFORM_BARS }, () => 0.08));
    } catch {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not pause the recording.'));
    }
  }

  private async beginSessionAfterMicReady(): Promise<void> {
    try {
      await firstValueFrom(this.store.dispatch(new VoiceInputAction.StartRecording()));
      if (this.mode === 'attachment' && this.recorder.engine === 'web-audio-wav') {
        this.recorder.cancelRecording();
        this.store.dispatch(
          new AppAction.ShowErrorInUI(
            'This browser records uncompressed audio. Long recordings are not available.',
          ),
        );
        this.dialogRef.close();
        return;
      }
      this.phase.set('recording');
      this.startClock();
      if (this.mode === 'title') {
        this.progressRing?.start();
        this.recordingTimeout = window.setTimeout(() => this.apply(), TITLE_LIMIT_MS);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      this.store.dispatch(
        new AppAction.ShowErrorInUI(
          'Could not access the microphone. Check permissions and try again.',
        ),
      );
      this.dialogRef.close();
    }
  }

  private async saveAttachment(): Promise<void> {
    this.phase.set('saving');
    this.stopClock();
    try {
      const blob = await this.recorder.stopRecording();
      if (blob.size > TaskConst.AUDIO_MAX_BYTES) {
        this.store.dispatch(new AppAction.ShowErrorInUI('The recording is too large to save.'));
        this.finalize();
        return;
      }
      this.audioReady.emit({
        blob,
        durationMs: Math.max(0, Math.round(this.elapsedMs)),
      });
      this.finalize();
    } catch {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not save the recording.'));
      this.finalize();
    }
  }

  private startClock(): void {
    this.lastTick = performance.now();
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
    this.bars.set(this.barsFromLevel(this.recorder.level()));
    const bytes = this.recorder.capturedBytes();
    const nativeCap =
      this.recorder.engine === 'native' && this.elapsedMs >= NATIVE_RECORDING_LIMIT_MS;
    if ((bytes > 0 && bytes >= TaskConst.AUDIO_RECORDING_STOP_BYTES) || nativeCap) {
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

  private barsFromLevel(level: number): number[] {
    return Array.from({ length: WAVEFORM_BARS }, (_, index) => {
      const shape = 0.35 + 0.65 * Math.abs(Math.sin(index + level * 6));
      return Math.max(0.08, Math.min(1, level * shape));
    });
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
