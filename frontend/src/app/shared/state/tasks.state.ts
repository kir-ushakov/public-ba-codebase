import { State, Action, StateContext, Selector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import {
  patch,
  append,
  updateItem,
  iif,
  insertItem,
  removeItem,
} from "@ngxs/store/operators";
import { v4 as uuidv4 } from "uuid";
import {
  Task,
  ETaskStatus,
  ETaskType,
  Change,
  EChangeAction,
  EChangedEntity,
} from "src/app/shared/models/";
import { UserState } from "./user.state";
import { MbTaskScreenAction } from "src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions";
import { AppAction } from "./app.actions";
import { SyncServiceAPIAction } from "../services/api/server-changes.actions";
import {
  UploadImageResponseDTO,
  ImageUploaderService,
} from "../services/api/image-uploader.service";

interface ITasksStateModel {
  entities: Array<Task>;
}

@State<ITasksStateModel>({
  name: "tasks",
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TasksState {
  static readonly actualStatuses: Array<ETaskStatus> = [ETaskStatus.Todo];

  constructor(private imageUploaderService: ImageUploaderService) {}

  @Selector([TasksState, UserState.userId])
  static allTasks(state: ITasksStateModel, userId: string): Array<Task> {
    return this.getSortedUserTasks(state, userId);
  }

  @Selector([TasksState, UserState.userId])
  static actualTasks(state: ITasksStateModel, userId: string): Array<Task> {
    const allTasks = this.getSortedUserTasks(state, userId);
    return allTasks.filter((t) => TasksState.actualStatuses.includes(t.status));
  }

  @Action(MbTaskScreenAction.CreateTask)
  async createTask(
    ctx: StateContext<ITasksStateModel>,
    { taskInitData, userId }: { taskInitData: Task; userId: string },
  ): Promise<void> {
    const now = this.now();

    const baseTask = this.createTaskEntity(taskInitData, userId, now);

    const taskWithImage = await this.processImageUpload(baseTask);

    ctx.setState(
      patch({
        entities: append([taskWithImage]),
      }),
    );

    ctx.dispatch(
      new AppAction.ChangeForSyncOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Created,
        object: taskWithImage,
        modifiedAt: now,
      } as Change),
    );
  }

  @Action(MbTaskScreenAction.UpdateTask)
  updateTask(
    ctx: StateContext<ITasksStateModel>,
    { taskUpdateData }: { taskUpdateData: Task },
  ) {
    ctx.setState(
      patch({
        entities: updateItem(
          (task) => task.id === taskUpdateData.id,
          patch({ ...taskUpdateData }),
        ),
      }),
    );

    const updatedTask: Task = ctx
      .getState()
      .entities.find((t) => t.id === taskUpdateData.id);

    if (!updatedTask) {
      console.error(
        `Task with id ${taskUpdateData.id} was not found after update.`,
      );
      return;
    }

    ctx.dispatch(
      new AppAction.ChangeForSyncOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: updatedTask,
        modifiedAt: this.now(),
      } as Change),
    );
  }

  @Action(MbTaskScreenAction.DeleteTask)
  delete(ctx: StateContext<ITasksStateModel>, { taskId }: { taskId: string }) {
    ctx.setState(
      patch({
        entities: removeItem<Task>((task) => task.id === taskId),
      }),
    );

    const now = this.now();

    ctx.dispatch(
      new AppAction.ChangeForSyncOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Deleted,
        object: { id: taskId, modifiedAt: now },
        modifiedAt: now,
      }),
    );
  }

  @Action(SyncServiceAPIAction.ServerChangesLoaded)
  synchronize(
    ctx: StateContext<ITasksStateModel>,
    { changes }: { changes: Change[] },
  ): void {
    const taskChanges = changes.filter((c) => c.entity === EChangedEntity.Task);
    for (const taskChange of taskChanges) {
      if (taskChange.action === EChangeAction.Deleted) {
        ctx.setState(
          patch({
            entities: removeItem<Task>(
              (task) => task.id === taskChange.object.id,
            ),
          }),
        );
      } else {
        const task = taskChange.object as Task;
        ctx.setState(
          patch({
            entities: iif<Array<Task>>(
              (tasks) => tasks.some((t) => t.id === task.id),
              updateItem((t) => t.id === task.id, patch(task)),
              insertItem(task),
            ),
          }),
        );
      }
    }
  }

  private createTaskEntity(
    taskInitData: Task,
    userId: string,
    timestamp: string,
  ): Task {
    return {
      type: ETaskType.Basic,
      userId,
      id: uuidv4(),
      title: taskInitData.title,
      imageUri: taskInitData.imageUri,
      status: ETaskStatus.Todo,
      createdAt: timestamp,
      modifiedAt: timestamp,
    };
  }

  private async processImageUpload(task: Task): Promise<Task> {
    if (!task.imageUri) return task;

    try {
      const QUALITY = 0.6;
      const res: UploadImageResponseDTO =
        await this.imageUploaderService.uploadImageFromBlobUri(
          task.imageUri,
          QUALITY,
        );
      const newImageUri = `${ImageUploaderService.IMAGE_API_ENDPOINT}/${res.fileId}.${res.extension}`;
      return { ...task, imageUri: newImageUri };
    } catch (error) {
      console.log("Image upload failed");
      return task;
    }
  }

  private static getSortedUserTasks(
    state: ITasksStateModel,
    userId: string,
  ): Task[] {
    return state.entities
      .filter((e) => e.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // descending order
      });
  }

  private now(): string {
    return new Date().toISOString();
  }
}
