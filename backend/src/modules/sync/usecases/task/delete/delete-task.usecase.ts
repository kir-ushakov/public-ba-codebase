import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { ImageRepoService } from '../../../../../shared/repo/image-repo.service.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import { Action, IActionProps } from '../../../../../shared/domain/models/actions.js';
import { Task } from '../../../../../shared/domain/models/task.js';
import { EActionType } from '../../../../../shared/infra/database/mongodb/action.model.js';
import { IImageStorage } from '../../../../files/services/image-storage/image-storage.interface.js';
import { LocalAudioStorage } from '../../../../files/services/audio-storage/local-audio-storage.service.js';
import { DeleteTaskError, DeleteTaskErrors } from './delete-task.errors.js';

type Request = {
  userId: string;
  taskId: string;
};

type Response = Result<void, DeleteTaskError>;

export class DeleteTaskUsecase implements UseCase<Request, Promise<Response>> {
  private taskRepoService: TaskRepoService;
  private actionRepo: ActionRepo;
  private imageRepo: ImageRepoService;
  private imageStorage: IImageStorage;
  private audioStorage: LocalAudioStorage;

  constructor(
    taskRepoService: TaskRepoService,
    actionRepo: ActionRepo,
    imageRepo: ImageRepoService,
    imageStorage: IImageStorage,
    audioStorage: LocalAudioStorage,
  ) {
    this.taskRepoService = taskRepoService;
    this.actionRepo = actionRepo;
    this.imageRepo = imageRepo;
    this.imageStorage = imageStorage;
    this.audioStorage = audioStorage;
  }

  public async execute(req: Request): Promise<Response> {
    const task = await this.taskRepoService.findUserTaskById(req.userId, req.taskId);
    if (!task) {
      return Result.ok<void, DeleteTaskError>();
    }

    const cleaned = await this.deleteAttachments(task);
    if (cleaned.isFailure) {
      return cleaned;
    }

    await this.taskRepoService.deleteTaskById(req.taskId);

    const actionProps: IActionProps = {
      userId: req.userId,
      type: EActionType.TaskDeleted,
      occurredAt: new Date(),
      entityId: req.taskId,
    };
    const action: Action = Action.create(actionProps);
    await this.actionRepo.create(action);

    return Result.ok<void, DeleteTaskError>();
  }

  private async deleteAttachments(task: Task): Promise<Response> {
    const imageIds = uniqueNonEmpty([...(task.images ?? []), task.imageId]);
    const images = await this.imageRepo.findUserImagesByIds(task.userId, imageIds);
    const localImageIds: string[] = [];
    for (const image of images) {
      if (image.storageType !== 'local') {
        continue;
      }
      if (image.fileId) {
        const removed = await this.imageStorage.delete(image.fileId);
        if (removed.isFailure) {
          return DeleteTaskErrors.AttachmentCleanupFailed(removed.error);
        }
      }
      localImageIds.push(image.imageId);
    }
    await this.imageRepo.deleteUserImages(task.userId, localImageIds);

    const audioIds = uniqueNonEmpty((task.audioAttachments ?? []).map(item => item.id));
    for (const audioId of audioIds) {
      const removed = await this.audioStorage.delete({ userId: task.userId, audioId });
      if (removed.isFailure) {
        return DeleteTaskErrors.AttachmentCleanupFailed(removed.error);
      }
    }

    return Result.ok<void, DeleteTaskError>();
  }
}

function uniqueNonEmpty(ids: (string | undefined)[]): string[] {
  const unique: string[] = [];
  for (const id of ids) {
    if (id && !unique.includes(id)) {
      unique.push(id);
    }
  }
  return unique;
}
