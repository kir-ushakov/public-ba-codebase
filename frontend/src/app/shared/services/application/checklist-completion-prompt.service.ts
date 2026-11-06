import { Injectable, signal } from '@angular/core';
import { ETaskStatus } from '@brainassistant/contracts';

export type ChecklistCompletionPrompt = {
  taskId: string;
  status: ETaskStatus.Todo | ETaskStatus.Active;
};

@Injectable({ providedIn: 'root' })
export class ChecklistCompletionPromptService {
  readonly prompt = signal<ChecklistCompletionPrompt | null>(null);

  offer(prompt: ChecklistCompletionPrompt): void {
    this.prompt.set(prompt);
  }

  dismiss(): void {
    this.prompt.set(null);
  }
}
