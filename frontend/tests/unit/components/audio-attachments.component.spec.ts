import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ETaskStatus } from '@brainassistant/contracts';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { TranscriptionFailure } from 'src/app/shared/helpers/transcription-failure.function';
import { AudioAttachmentsComponent } from 'src/app/mobile-app/components/screens/task-screen/audio-attachments/audio-attachments.component';
import { TaskScreenState } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { AudioService } from 'src/app/shared/services/application/audio.service';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { AppState } from 'src/app/shared/state/app.state';

const attachment = {
  id: 'aud-1',
  durationMs: 3200,
  mimeType: 'audio/webm',
  createdAt: '2024-06-01T10:00:00.000Z',
};

describe('AudioAttachmentsComponent', () => {
  const task = signal({
    audioAttachments: [attachment],
    status: ETaskStatus.Todo,
  });
  const online = signal(true);

  beforeEach(async () => {
    task.set({ audioAttachments: [{ ...attachment }], status: ETaskStatus.Todo });
    online.set(true);
    await TestBed.configureTestingModule({
      imports: [AudioAttachmentsComponent],
      providers: [
        {
          provide: Store,
          useValue: {
            selectSignal: (selector: unknown) => {
              if (selector === TaskScreenState.task) {
                return task;
              }
              if (selector === AppState.online) {
                return online;
              }
              throw new Error('unexpected selector');
            },
            dispatch: jest.fn().mockReturnValue(of(undefined)),
          },
        },
        { provide: AudioService, useValue: { objectUrl: jest.fn() } },
        { provide: DialogService, useValue: {} },
      ],
    }).compileComponents();
  });

  function render(canAdd = true): ComponentFixture<AudioAttachmentsComponent> {
    const fixture = TestBed.createComponent(AudioAttachmentsComponent);
    fixture.componentRef.setInput('canAdd', canAdd);
    fixture.componentRef.setInput('canRemove', true);
    fixture.detectChanges();
    return fixture;
  }

  it('shows Transcribe with AI until the saved task has a transcription', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    const add = host.querySelector('[data-test="audio-attachment-add"]');
    const card = host.querySelector('[data-test="audio-attachment-card"]');
    expect(add?.textContent).toContain('Add audio recording');
    expect(card).not.toBeNull();
    expect(
      add && card ? add.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
    ).toBeTruthy();
    expect(host.querySelector('[data-test="audio-attachment-menu"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Remove audio attachment"]')).toBeNull();
    expect(host.querySelector('[data-test="audio-attachment-transcribe"]')?.textContent).toContain(
      'Transcribe with AI',
    );
    expect(host.querySelector('[data-test="audio-attachment-transcription"]')).toBeNull();

    task.set({
      audioAttachments: [
        {
          ...attachment,
          transcription: {
            text: 'Saved voice note',
            createdAt: '2024-06-01T10:01:00.000Z',
          },
        },
      ],
      status: ETaskStatus.Todo,
    });
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-transcribe"]')).toBeNull();
    const view = host.querySelector<HTMLButtonElement>(
      '[data-test="audio-attachment-view-transcription"]',
    );
    expect(view?.textContent).toContain('View transcription');
    expect(host.textContent).not.toContain('Transcription available');
    view?.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Transcription',
    );
    expect(
      host.querySelector('[data-test="audio-attachment-transcription"]')?.textContent,
    ).toContain('Saved voice note');
    expect(host.querySelector('[data-test="audio-attachment-copy"]')?.textContent).toContain(
      'Copy',
    );
    expect(
      host.querySelector('[data-test="audio-attachment-add-to-description"]')?.textContent,
    ).toContain('Add to Description');
  });

  it('opens Delete recording from the attachment menu', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="audio-attachment-menu"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-delete"]')?.textContent).toContain(
      'Delete recording',
    );
  });

  it('shows Transcription failed and Retry when the transcript is not saved', async () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="audio-attachment-transcribe"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-transcribe"]')).toBeNull();
    expect(host.querySelector('[data-test="audio-attachment-error"]')?.textContent).toContain(
      'Transcription failed',
    );
    expect(host.querySelector('[data-test="audio-attachment-retry"]')?.textContent).toContain(
      'Retry transcription',
    );
    expect(
      host.querySelector('[data-test="audio-attachment-error"] .material-symbols-rounded')
        ?.textContent,
    ).toContain('error_outline');
  });

  it('shows No connection and Retry transcription while offline', () => {
    online.set(false);
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(Store) as { dispatch: jest.Mock };
    store.dispatch.mockClear();

    host.querySelector<HTMLButtonElement>('[data-test="audio-attachment-transcribe"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-error"]')?.textContent).toContain(
      'No connection',
    );
    expect(host.querySelector('[data-test="audio-attachment-retry"]')?.textContent).toContain(
      'Retry transcription',
    );
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('does not offer Retry when the recording cannot be transcribed', async () => {
    const store = TestBed.inject(Store) as { dispatch: jest.Mock };
    store.dispatch.mockReturnValue(
      new Observable(subscriber => {
        queueMicrotask(() => subscriber.error(TranscriptionFailure.unreadable()));
      }),
    );
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    await fixture.componentInstance.transcribe('aud-1');
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-error"]')?.textContent).toContain(
      "This recording can't be transcribed.",
    );
    expect(host.querySelector('[data-test="audio-attachment-retry"]')).toBeNull();
  });

  it('shows an empty transcription instead of an error when the transcript is blank', async () => {
    const store = TestBed.inject(Store) as { dispatch: jest.Mock };
    store.dispatch.mockReturnValue(
      new Observable(subscriber => {
        queueMicrotask(() => subscriber.error(TranscriptionFailure.empty()));
      }),
    );
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    await fixture.componentInstance.transcribe('aud-1');
    fixture.detectChanges();

    expect(host.querySelector('[data-test="audio-attachment-error"]')).toBeNull();
    expect(host.querySelector('[data-test="audio-attachment-retry"]')).toBeNull();
    expect(host.querySelector('[data-test="audio-attachment-empty"]')?.textContent).toContain(
      'No text in this recording.',
    );
    expect(
      host.querySelector('[data-test="audio-attachment-transcription"]')?.textContent,
    ).toContain('No text in this recording.');
    expect(host.querySelector('[data-test="audio-attachment-copy"]')).toBeNull();
    expect(host.querySelector('[data-test="audio-attachment-add-to-description"]')).toBeNull();
  });

  it('hides the creation time until a second recording exists', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="audio-attachment-created"]')).toBeNull();

    task.set({
      audioAttachments: [
        attachment,
        { ...attachment, id: 'aud-2', createdAt: '2024-06-02T15:30:00.000Z' },
        { ...attachment, id: 'aud-3', createdAt: '' },
      ],
      status: ETaskStatus.Todo,
    });
    fixture.detectChanges();

    const created = host.querySelectorAll('[data-test="audio-attachment-created"]');
    expect(created.length).toBe(2);
    expect(created[0]?.textContent?.trim().length).toBeGreaterThan(0);
    expect(host.querySelector('[data-test="audio-attachment-progress"]')).toBeNull();
  });

  it('shows a seekable progress bar only after playback starts', async () => {
    const originalAudio = globalThis.Audio;
    FakeAudio.instances = [];
    globalThis.Audio = FakeAudio as unknown as typeof Audio;
    const audio = TestBed.inject(AudioService) as { objectUrl: jest.Mock };
    audio.objectUrl.mockResolvedValue('blob:aud-1');

    try {
      const fixture = render();
      const host = fixture.nativeElement as HTMLElement;
      const play = host.querySelector<HTMLButtonElement>('[data-test="audio-attachment-play"]');

      play?.click();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
      expect(fixture.componentInstance.playingId()).toBe('aud-1');

      const progress = host.querySelector<HTMLInputElement>(
        '[data-test="audio-attachment-progress"]',
      );
      expect(progress).not.toBeNull();
      expect(play?.getAttribute('aria-label')).toBe('Pause');

      const player = FakeAudio.instances[0];
      if (!progress || !player) {
        throw new Error('playback did not start');
      }
      player.currentTime = 4;
      player.emit('timeupdate');
      fixture.detectChanges();
      expect(progress.value).toBe('250');
      expect(host.querySelector('[data-test="audio-attachment-duration"]')?.textContent).toContain(
        '00:04 / 00:16',
      );

      progress.value = '500';
      progress.dispatchEvent(new Event('input'));
      expect(player.currentTime).toBe(8);

      play?.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(host.querySelector('[data-test="audio-attachment-progress"]')).not.toBeNull();
      expect(play?.getAttribute('aria-label')).toBe('Play');

      player.emit('ended');
      fixture.detectChanges();
      expect(host.querySelector('[data-test="audio-attachment-progress"]')).toBeNull();
    } finally {
      globalThis.Audio = originalAudio;
    }
  });
});

class FakeAudio {
  static instances: FakeAudio[] = [];
  paused = true;
  currentTime = 4;
  duration = 16;
  private readonly listeners = new Map<string, Array<() => void>>();

  constructor(public src?: string) {
    FakeAudio.instances.push(this);
  }

  addEventListener(type: string, listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }
}
