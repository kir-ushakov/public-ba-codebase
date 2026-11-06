import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ETaskStatus } from '@brainassistant/contracts';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import { checklistKeepLabel } from 'src/app/shared/helpers/checklist.function';
import {
  ChecklistCompletionPromptService,
  type ChecklistCompletionPrompt,
} from 'src/app/shared/services/application/checklist-completion-prompt.service';
import { TasksAction } from 'src/app/shared/state/tasks.action';

@Component({
  selector: 'ba-checklist-completion-dialog',
  templateUrl: './checklist-completion-dialog.component.html',
  styleUrl: './checklist-completion-dialog.component.scss',
})
export class ChecklistCompletionDialogComponent {
  private readonly prompts = inject(ChecklistCompletionPromptService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.prompt()) {
      this.keep();
    }
  }

  prompt(): ChecklistCompletionPrompt | null {
    return this.prompts.prompt();
  }

  keepLabel(): string {
    return checklistKeepLabel(this.prompt()?.status ?? ETaskStatus.Todo);
  }

  keep(): void {
    this.prompts.dismiss();
  }

  markDone(): void {
    const prompt = this.prompt();
    if (!prompt) {
      return;
    }
    this.store.dispatch(
      new TasksAction.UpdateTask({
        taskId: prompt.taskId,
        changes: { status: ETaskStatus.Done },
      }),
    );
    if (this.router.url.includes(prompt.taskId)) {
      this.store.dispatch(TaskScreenAction.Close);
    }
    this.prompts.dismiss();
  }
}
