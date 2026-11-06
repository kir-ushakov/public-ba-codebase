import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ChecklistCompletionDialogComponent } from 'src/app/shared/components/ui-elements/checklist-completion-dialog/checklist-completion-dialog.component';
import { ChecklistCompletionPromptService } from 'src/app/shared/services/application/checklist-completion-prompt.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('ChecklistCompletionDialogComponent', () => {
  let fixture: ComponentFixture<ChecklistCompletionDialogComponent>;
  let prompts: ChecklistCompletionPromptService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChecklistCompletionDialogComponent],
      providers: [
        provideStore([TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: Router, useValue: { url: '/home' } },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.reset({
      tasks: {
        entities: [
          {
            id: 'task-1',
            userId: 'user-1',
            type: ETaskType.Basic,
            title: 'Shopping',
            status: ETaskStatus.Todo,
            checklist: [{ id: 'a', text: 'Buy cat food', completed: true }],
            createdAt: '2024-06-01T10:00:00.000Z',
            modifiedAt: '2024-06-01T10:00:00.000Z',
          },
        ],
      },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId: 'user-1',
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });
    prompts = TestBed.inject(ChecklistCompletionPromptService);
    prompts.dismiss();
    fixture = TestBed.createComponent(ChecklistCompletionDialogComponent);
    fixture.detectChanges();
  });

  it('asks to mark a to-do done and leaves the status when kept', () => {
    prompts.offer({ taskId: 'task-1', status: ETaskStatus.Todo });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="checklist-completion-title"]')?.textContent).toContain(
      'All checklist items completed!',
    );
    expect(host.querySelector('[data-test="checklist-completion-message"]')?.textContent).toContain(
      'Mark this task as done?',
    );
    expect(host.querySelector('[data-test="checklist-completion-keep"]')?.textContent).toContain(
      'Keep as To do',
    );

    host.querySelector<HTMLButtonElement>('[data-test="checklist-completion-keep"]')?.click();
    fixture.detectChanges();

    expect(prompts.prompt()).toBeNull();
    expect(TestBed.inject(Store).selectSnapshot(TasksState.allTasks)[0]?.status).toBe(
      ETaskStatus.Todo,
    );
  });

  it('labels the dismiss action Keep Active for an active task', () => {
    prompts.offer({ taskId: 'task-1', status: ETaskStatus.Active });
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-test="checklist-completion-keep"]',
      )?.textContent,
    ).toContain('Keep Active');
  });

  it('marks the task done from the primary action', async () => {
    prompts.offer({ taskId: 'task-1', status: ETaskStatus.Todo });
    fixture.detectChanges();
    const store = TestBed.inject(Store);
    const markedDone = firstValueFrom(
      store.select(TasksState.allTasks).pipe(
        filter(tasks => tasks[0]?.status === ETaskStatus.Done),
        take(1),
      ),
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="checklist-completion-done"]')
      ?.click();
    await markedDone;
    fixture.detectChanges();

    expect(prompts.prompt()).toBeNull();
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Done);
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.checklist).toEqual([
      { id: 'a', text: 'Buy cat food', completed: true },
    ]);
  });
});
