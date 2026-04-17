import { Component, inject, output, signal, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MicIconComponent } from './mic-icon/mic-icon.component';
import { ProgressRingComponent } from './progress-ring/progress-ring.component';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
import { firstValueFrom } from 'rxjs';

const DEFAULT_MIC_COLOR = 'rgba(0, 255, 0, 0.7)';
const CIRCLE_RADIUS = 147;
const RECORDING_DURATION = 10000;

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

  readonly dialogRef = inject(MatDialogRef<VoiceRecorderComponent>);
  private readonly store = inject(Store);

  radius = CIRCLE_RADIUS;
  micColor = signal(DEFAULT_MIC_COLOR);
  readonly recordingDuration = RECORDING_DURATION;

  get radiusCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius}px)`;
  }

  get micSizeCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius / 2}px)`;
  }

  private recordingTimeout: number | null = null;
  private isFinalized = false;

  ngAfterViewInit(): void {
    void this.beginSessionAfterMicReady();
  }

  stopRecording(): void {
    this.stopped.emit();
    this.finalize();
  }

  cancel(): void {
    this.canceled.emit();
    this.finalize();
  }

  private async beginSessionAfterMicReady(): Promise<void> {
    try {
      await firstValueFrom(this.store.dispatch(new VoiceInputAction.StartRecording()));
      this.startRecordingUi();
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

  private startRecordingUi(duration = RECORDING_DURATION): void {
    this.progressRing?.start();
    this.recordingTimeout = window.setTimeout(() => this.stopRecording(), duration);
  }

  private finalize(): void {
    if (this.isFinalized) return;
    this.isFinalized = true;

    this.progressRing?.stop();
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    this.dialogRef.close();
  }
}
