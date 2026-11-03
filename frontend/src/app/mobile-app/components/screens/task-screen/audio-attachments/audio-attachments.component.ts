import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { TaskConst, type AudioAttachment } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { BottomSheetComponent } from 'src/app/shared/components/ui-elements/bottom-sheet/bottom-sheet.component';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import { VoiceRecorderComponent } from 'src/app/shared/features/voice-input/components/voice-recorder/voice-recorder.component';
import { AudioService } from 'src/app/shared/services/application/audio.service';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { AppState } from 'src/app/shared/state/app.state';
import { appendTranscriptionToDescription } from 'src/app/shared/helpers/append-transcription-to-description.function';
import {
  TranscriptionFailure,
  type TranscriptionFailureKind,
} from 'src/app/shared/helpers/transcription-failure.function';
import { TaskScreenAction } from '../task-screen.actions';
import { TaskScreenState } from '../task-screen.state';

const DELETE_RECORDING_ITEM: ContextMenuItem = {
  id: 'delete',
  label: 'Delete recording',
  icon: 'delete',
  testId: 'audio-attachment-delete',
  danger: true,
};

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const PROGRESS_MAX = 1000;
const createdTimeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});
const createdDayFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
});

@Component({
  selector: 'ba-audio-attachments',
  imports: [BottomSheetComponent, ContextMenuComponent],
  templateUrl: './audio-attachments.component.html',
  styleUrl: './audio-attachments.component.scss',
})
export class AudioAttachmentsComponent {
  readonly deleteMenuItems: ContextMenuItem[] = [DELETE_RECORDING_ITEM];
  readonly canAdd = input(false);
  readonly canRemove = input(false);
  /** View opens edit instead of writing the description itself. */
  readonly mutatesDescription = input(true);
  readonly descriptionAppend = output<string>();
  readonly online = inject(Store).selectSignal(AppState.online);
  readonly openTranscriptionId = signal<string | null>(null);
  readonly openMenuId = signal<string | null>(null);
  readonly playingId = signal<string | null>(null);
  readonly progressMax = PROGRESS_MAX;
  private readonly transcribingIds = signal<ReadonlySet<string>>(new Set());
  private readonly blankIds = signal<ReadonlySet<string>>(new Set());
  private readonly failures = signal<Readonly<Record<string, TranscriptionFailure>>>({});
  private readonly engagedIds = signal<ReadonlySet<string>>(new Set());
  private readonly addedIds = signal<ReadonlySet<string>>(new Set());
  private readonly playbackProgress = signal<Readonly<Record<string, number>>>({});
  private readonly positionMs = signal<Readonly<Record<string, number>>>({});

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
        URL.revokeObjectURL?.(player.url);
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

  isTranscribing(id: string): boolean {
    return this.transcribingIds().has(id);
  }

  isBlank(id: string): boolean {
    return this.blankIds().has(id);
  }

  failure(id: string): TranscriptionFailure | null {
    return this.failures()[id] ?? null;
  }

  failureKind(id: string): TranscriptionFailureKind | null {
    return this.failure(id)?.kind ?? null;
  }

  showProgress(id: string): boolean {
    return this.engagedIds().has(id);
  }

  progressValue(id: string): number {
    return this.playbackProgress()[id] ?? 0;
  }

  playbackLabel(item: AudioAttachment): string {
    if (!this.showProgress(item.id)) {
      return this.durationLabel(item.durationMs);
    }
    const position = this.positionMs()[item.id] ?? 0;
    return `${this.durationLabel(position)} / ${this.durationLabel(this.playbackDurationMs(item))}`;
  }

  /** Shown only when several recordings exist and this one has a real timestamp. */
  createdLabel(createdAt: string | undefined): string | null {
    if (this.attachments().length < 2 || !createdAt) {
      return null;
    }
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const time = createdTimeFormat.format(date);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return `Today, ${time}`;
    }
    return `${createdDayFormat.format(date)}, ${time}`;
  }

  openTranscript(): { id: string; durationMs: number; text: string } | null {
    const id = this.openTranscriptionId();
    if (!id) {
      return null;
    }
    const item = this.attachments().find(attachment => attachment.id === id);
    const text = item?.transcription?.text.trim() ?? '';
    const empty = this.blankIds().has(id);
    if (!item || (!text && !empty)) {
      return null;
    }
    return { id, durationMs: item.durationMs, text };
  }

  wasAdded(id: string): boolean {
    return this.addedIds().has(id);
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.update(open => (open === id ? null : id));
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  onMenu(id: string, action: string): void {
    this.closeMenu();
    if (action === DELETE_RECORDING_ITEM.id) {
      this.remove(id);
    }
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
    if (this.isTranscribing(id) || this.failureKind(id) === 'permanent') {
      return;
    }
    if (!this.online()) {
      this.setFailure(id, TranscriptionFailure.offline());
      return;
    }
    this.setMembership(this.transcribingIds, id, true);
    this.setMembership(this.blankIds, id, false);
    this.clearFailure(id);
    let thrown: unknown;
    try {
      await firstValueFrom(this.store.dispatch(new TaskScreenAction.TranscribeAudioAttachment(id)));
    } catch (error) {
      thrown = error;
    } finally {
      this.setMembership(this.transcribingIds, id, false);
    }
    if (!this.attachments().some(item => item.id === id)) {
      return;
    }
    if (thrown) {
      const failure = TranscriptionFailure.from(thrown);
      if (failure.kind === 'empty') {
        this.setMembership(this.blankIds, id, true);
        this.openTranscriptionId.set(id);
        return;
      }
      this.setFailure(id, failure);
      return;
    }
    const saved = this.attachments()
      .find(item => item.id === id)
      ?.transcription?.text.trim();
    if (!saved) {
      this.setFailure(id, TranscriptionFailure.failed());
    }
  }

  openTranscription(id: string): void {
    const text =
      this.attachments()
        .find(item => item.id === id)
        ?.transcription?.text.trim() ?? '';
    if (!text && !this.blankIds().has(id)) {
      return;
    }
    this.openTranscriptionId.set(id);
  }

  closeTranscription(): void {
    this.openTranscriptionId.set(null);
  }

  copy(text: string): void {
    void navigator.clipboard.writeText(text).catch(() => {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not copy the transcription.'));
    });
  }

  addToDescription(id: string, text: string): void {
    if (this.wasAdded(id)) {
      return;
    }
    const next = appendTranscriptionToDescription(this.task().description, text);
    if (!next) {
      this.store.dispatch(
        new AppAction.ShowErrorInUI('The description is too long for this transcription.'),
      );
      return;
    }
    if (this.mutatesDescription()) {
      this.descriptionAppend.emit(text);
    } else {
      this.store.dispatch(new TaskScreenAction.AddTranscriptionToDescription(text));
    }
    this.setMembership(this.addedIds, id, true);
    this.closeTranscription();
  }

  seek(id: string, event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const player = this.players.get(id);
    const duration = player?.audio.duration ?? 0;
    if (!player || !Number.isFinite(duration) || duration <= 0) {
      return;
    }
    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      return;
    }
    player.audio.currentTime = (value / PROGRESS_MAX) * duration;
    this.rememberPosition(id, player.audio);
  }

  async togglePlay(id: string): Promise<void> {
    const current = this.players.get(id);
    if (current && this.playingId() === id && !current.audio.paused) {
      current.audio.pause();
      this.rememberPosition(id, current.audio);
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
      element.addEventListener('timeupdate', () => this.rememberPosition(id, element));
      element.addEventListener('ended', () => {
        element.currentTime = 0;
        this.setProgress(id, 0);
        this.setMembership(this.engagedIds, id, false);
        if (this.playingId() === id) {
          this.playingId.set(null);
        }
      });
      player = { audio: element, url };
      this.players.set(id, player);
    }
    this.pauseOthers(id);
    try {
      await player.audio.play();
    } catch {
      this.store.dispatch(new AppAction.ShowErrorInUI('Could not play this recording.'));
      return;
    }
    this.setMembership(this.engagedIds, id, true);
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

  private setFailure(id: string, failure: TranscriptionFailure): void {
    this.failures.update(current => ({ ...current, [id]: failure }));
  }

  private clearFailure(id: string): void {
    this.failures.update(current => {
      if (!(id in current)) {
        return current;
      }
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  private setMembership(source: typeof this.transcribingIds, id: string, present: boolean): void {
    source.update(current => {
      const next = new Set(current);
      if (present) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private pauseOthers(id: string): void {
    for (const [otherId, other] of this.players) {
      if (otherId !== id && !other.audio.paused) {
        other.audio.pause();
        this.rememberPosition(otherId, other.audio);
      }
    }
    if (this.playingId() && this.playingId() !== id) {
      this.playingId.set(null);
    }
  }

  private playbackDurationMs(item: AudioAttachment): number {
    const duration = this.players.get(item.id)?.audio.duration;
    if (duration && Number.isFinite(duration) && duration > 0) {
      return Math.round(duration * MS_PER_SECOND);
    }
    return item.durationMs;
  }

  private rememberPosition(id: string, element: HTMLAudioElement): void {
    const duration = element.duration;
    if (!duration || !Number.isFinite(duration)) {
      return;
    }
    this.setProgress(id, Math.round((element.currentTime / duration) * PROGRESS_MAX));
    const position = Math.max(0, Math.round(element.currentTime * MS_PER_SECOND));
    this.positionMs.update(current => ({ ...current, [id]: position }));
  }

  private setProgress(id: string, value: number): void {
    this.playbackProgress.update(current => ({ ...current, [id]: value }));
  }

  private stop(id: string): void {
    const player = this.players.get(id);
    if (player) {
      player.audio.pause();
      player.audio.src = '';
      URL.revokeObjectURL?.(player.url);
      this.players.delete(id);
    }
    if (this.playingId() === id) {
      this.playingId.set(null);
    }
    this.setMembership(this.engagedIds, id, false);
    this.positionMs.update(current => {
      if (!(id in current)) {
        return current;
      }
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
}
