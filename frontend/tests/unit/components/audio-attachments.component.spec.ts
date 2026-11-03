import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ETaskStatus } from '@brainassistant/contracts';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
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

    expect(host.querySelector('[data-test="audio-attachment-add"]')?.textContent).toContain(
      'Add audio recording',
    );
    expect(host.querySelector('[data-test="audio-attachment-card"]')).not.toBeNull();
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
    view?.click();
    fixture.detectChanges();
    expect(
      host.querySelector('[data-test="audio-attachment-transcription"]')?.textContent,
    ).toContain('Saved voice note');
    expect(host.querySelector('[data-test="audio-attachment-copy"]')?.textContent).toContain(
      'Copy transcription',
    );
    expect(
      host.querySelector('[data-test="audio-attachment-add-to-description"]')?.textContent,
    ).toContain('Add to description');
  });

  it('disables Transcribe with AI while offline', () => {
    online.set(false);
    const fixture = render(false);
    const button = fixture.nativeElement.querySelector<HTMLButtonElement>(
      '[data-test="audio-attachment-transcribe"]',
    );

    expect(button?.disabled).toBe(true);
  });
});
