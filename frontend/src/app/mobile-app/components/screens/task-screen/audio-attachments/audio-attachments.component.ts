import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { TaskConst, type AudioAttachment } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { VoiceRecorderComponent } from 'src/app/shared/features/voice-input/components/voice-recorder/voice-recorder.component';
import { AudioService } from 'src/app/shared/services/application/audio.service';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { AppState } from 'src/app/shared/state/app.state';
import { TaskScreenAction } from '../task-screen.actions';
import { TaskScreenState } from '../task-screen.state';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

@Component({
  selector: 'ba-audio-attachments',
  templateUrl: './audio-attachments.component.html',
  styleUrl: './audio-attachments.component.scss',
})
export class AudioAttachmentsComponent {
  readonly canAdd = input(false);
  readonly canRemove = input(false);
  /** View opens edit instead of writing the description itself. */
  readonly mutatesDescription = input(true);
  readonly descriptionAppend = output<string>();
  readonly online = inject(Store).selectSignal(AppState.online);
  readonly openTranscriptionId = signal<string | null>(null);
  readonly playingId = signal<string | null>(null);
  readonly transcribingId = signal<string | null>(null);

  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);
  private readonly audio = inject(AudioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly task = this.store.selectSignal(TaskScreenState.task);
  private readonly players = new Map<string, { audio: HTMLAudioElement; url: string }>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const player of this.players.values()) {
        player.audio.pause();
        URL.revokeObjectURL(player.url);
      }
      this.players.clear();
    });
  }

  attachments(): AudioAttachment[] {
    return this.task().audioAttachments ?? [];
  }

  atLimit(): boolean {
    return this.attachments().length >= TaskConst.AUDIO_ATTACHMENT_MAX_COUNT;
  }

  record(): void {
    if (!this.canAdd() || this.atLimit()) {
      return;
    }
    const dialogRef = this.dialog.showFullScreenDialog(VoiceRecorderComponent, {
      mode: 'attachment',
    });
    const recorder = dialogRef.componentInstance as VoiceRecorderComponent;
    const subscription = recorder.audioReady.subscribe(recording => {
      this.store.dispatch(
        new TaskScreenAction.AudioAttachmentCaptured(recording.blob, recording.durationMs),
      );
    });
    dialogRef.afterClosed().subscribe(() => subscription.unsubscribe());
  }

  remove(id: string): void {
    this.stop(id);
    this.store.dispatch(new TaskScreenAction.AudioAttachmentRemoved(id));
  }

  async transcribe(id: string): Promise<void> {
    if (!this.online() || this.transcribingId()) {
      return;
    }
    this.transcribingId.set(id);
    try {
      await firstValueFrom(this.store.dispatch(new TaskScreenAction.TranscribeAudioAttachment(id)));
    } finally {
      this.transcribingId.set(null);
    }
  }

  toggleTranscription(id: string): void {
    this.openTranscriptionId.set(this.openTranscriptionId() === id ? null : id);
  }

  copy(text: string): void {
    void navigator.clipboard.writeText(text).catch(() => {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not copy the transcription.'));
    });
  }

  addToDescription(text: string): void {
    if (this.mutatesDescription()) {
      this.descriptionAppend.emit(text);
      return;
    }
    this.store.dispatch(new TaskScreenAction.AddTranscriptionToDescription(text));
  }

  async togglePlay(id: string): Promise<void> {
    const current = this.players.get(id);
    if (current && this.playingId() === id && !current.audio.paused) {
      current.audio.pause();
      this.playingId.set(null);
      return;
    }
    let player = current;
    if (!player) {
      const url = await this.audio.objectUrl(id);
      if (!url) {
        this.store.dispatch(new AppAction.ShowErrorInUI('Could not play this recording.'));
        return;
      }
      const element = new Audio(url);
      element.addEventListener('ended', () => {
        if (this.playingId() === id) {
          this.playingId.set(null);
        }
      });
      player = { audio: element, url };
      this.players.set(id, player);
    }
    await player.audio.play();
    this.playingId.set(id);
  }

  durationLabel(durationMs: number): string {
    const total = Math.max(0, Math.floor(durationMs / MS_PER_SECOND));
    const hours = Math.floor(total / SECONDS_PER_HOUR);
    const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = total % SECONDS_PER_MINUTE;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  private stop(id: string): void {
    const player = this.players.get(id);
    if (!player) {
      return;
    }
    player.audio.pause();
    if (this.playingId() === id) {
      this.playingId.set(null);
    }
  }
}
