import { ApplicationRef } from '@angular/core';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { filterHomeTasks } from 'src/app/mobile-app/components/screens/home-screen/helpers/filter-home-tasks.function';
import { tasksForHomeMode } from 'src/app/mobile-app/components/screens/home-screen/helpers/home-content-mode.function';
import { OutboxEntry } from 'src/app/shared/models/outbox-entry.type';
import { Tag } from 'src/app/shared/models/tag.model';
import { Task } from 'src/app/shared/models/task.model';
import {
  DatabaseService,
  DATABASE_CONFIG,
  SYNCED_REVISION_ID,
} from 'src/app/shared/services/infrastructure/database.service';
import { LocalStore } from 'src/app/shared/services/infrastructure/local-store.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { TagsState } from 'src/app/shared/state/tags.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { Store } from '@ngxs/store';

type SeedPayload = {
  tasks: Task[];
  tags: Tag[];
  syncedRevision: number;
};

type BenchApi = {
  writeSeed(payload: SeedPayload): Promise<void>;
  loadAll(): Promise<number>;
  saveTask(task: Task): Promise<number>;
  deleteTask(task: Task): Promise<number>;
  applyBatch(revision: number): Promise<number>;
  timeSelectors(): SelectorSample;
  taskCount(): number;
};

type SelectorSample = {
  cachedAllTasksMs: number;
  resetMs: number;
  allTasksMs: number;
  actualTasksMs: number;
  statusFilterMs: number;
  tagFilterMs: number;
  sortMs: number;
  allCount: number;
  actualCount: number;
  todoCount: number;
};

declare global {
  interface Window {
    __BA_BENCH__?: BenchApi;
  }
}

export function installBenchmarkProbe(appRef: ApplicationRef): void {
  const store = appRef.injector.get(Store);
  const database = appRef.injector.get(DatabaseService);
  const localStore = appRef.injector.get(LocalStore);

  window.__BA_BENCH__ = {
    async writeSeed(payload: SeedPayload): Promise<void> {
      const db = await database.getDatabase();
      const tx = db.transaction(
        [
          DATABASE_CONFIG.STORES.TASKS,
          DATABASE_CONFIG.STORES.TAGS,
          DATABASE_CONFIG.STORES.OUTBOX,
          DATABASE_CONFIG.STORES.META,
        ],
        'readwrite',
      );
      await Promise.all([
        tx.objectStore(DATABASE_CONFIG.STORES.TASKS).clear(),
        tx.objectStore(DATABASE_CONFIG.STORES.TAGS).clear(),
        tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).clear(),
        tx.objectStore(DATABASE_CONFIG.STORES.META).clear(),
      ]);
      for (const task of payload.tasks) {
        await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).put(task);
      }
      for (const tag of payload.tags) {
        await tx.objectStore(DATABASE_CONFIG.STORES.TAGS).put(tag);
      }
      await tx.objectStore(DATABASE_CONFIG.STORES.META).put({
        id: SYNCED_REVISION_ID,
        syncedRevision: payload.syncedRevision,
      });
      await tx.done;
      await firstValueFrom(
        store.dispatch(
          new SyncAction.LocalDataHydrated({
            tasks: payload.tasks,
            tags: payload.tags,
            outbox: [],
            syncedRevision: payload.syncedRevision,
          }),
        ),
      );
    },

    async loadAll(): Promise<number> {
      const started = performance.now();
      await localStore.loadAll();
      return performance.now() - started;
    },

    async saveTask(task: Task): Promise<number> {
      const entry = outboxEntry(task, EChangeAction.Updated);
      const started = performance.now();
      await localStore.saveTaskAndEnqueue(task, entry);
      return performance.now() - started;
    },

    async deleteTask(task: Task): Promise<number> {
      const entry = outboxEntry(task, EChangeAction.Deleted);
      const started = performance.now();
      await localStore.deleteTaskAndEnqueue(task.userId, task.id, entry);
      return performance.now() - started;
    },

    async applyBatch(revision: number): Promise<number> {
      const tasks = store.selectSnapshot(TasksState.allTasks).slice(0, 100);
      const changes = tasks.map(task => ({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: { ...task, title: `${task.title} s` },
        modifiedAt: task.modifiedAt,
      }));
      const started = performance.now();
      await localStore.applyServerChangesAndRevision(changes, revision);
      return performance.now() - started;
    },

    timeSelectors(): SelectorSample {
      const cachedStarted = performance.now();
      store.selectSnapshot(TasksState.allTasks);
      const cachedAllTasksMs = performance.now() - cachedStarted;

      const snapshot = store.snapshot();
      const entities = snapshot.tasks.entities.map((task: Task, index: number) =>
        index === 0 ? { ...task, title: `${task.title} *` } : task,
      );
      const resetStarted = performance.now();
      store.reset({ ...snapshot, tasks: { entities } });
      const resetMs = performance.now() - resetStarted;

      const allStarted = performance.now();
      const all = store.selectSnapshot(TasksState.allTasks);
      const allTasksMs = performance.now() - allStarted;

      const actualStarted = performance.now();
      const actual = store.selectSnapshot(TasksState.actualTasks);
      const actualTasksMs = performance.now() - actualStarted;

      const statusStarted = performance.now();
      const todo = tasksForHomeMode(all, 'todo');
      const statusFilterMs = performance.now() - statusStarted;

      const tags = store.selectSnapshot(TagsState.forCurrentUser);
      const tagStarted = performance.now();
      filterHomeTasks(all, 'tag 01', tags);
      const tagFilterMs = performance.now() - tagStarted;

      const sortStarted = performance.now();
      [...all].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      const sortMs = performance.now() - sortStarted;

      return {
        cachedAllTasksMs,
        resetMs,
        allTasksMs,
        actualTasksMs,
        statusFilterMs,
        tagFilterMs,
        sortMs,
        allCount: all.length,
        actualCount: actual.length,
        todoCount: todo.length,
      };
    },

    taskCount(): number {
      return store.selectSnapshot(TasksState.allTasks).length;
    },
  };
}

function outboxEntry(task: Task, action: EChangeAction): OutboxEntry {
  return {
    id: `bench-out-${task.id}-${action}`,
    entityId: task.id,
    change: {
      entity: EChangedEntity.Task,
      action,
      object: task,
      modifiedAt: task.modifiedAt,
    },
  };
}
