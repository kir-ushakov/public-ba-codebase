import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import type { CreateTaskParams } from './create-task.usecase.js';

export function requestToUsecaseParams(
  payload: SendChangeContract.Request<TaskDTO>,
  userId: string,
): CreateTaskParams {
  const taskDto: TaskDTO = payload.changeableObjectDto;
  const { id, userId: _dtoUserId, ...taskPropsWithoutId } = taskDto;

  return {
    taskProps: {
      ...taskPropsWithoutId,
      userId,
      createdAt: new Date(taskDto.createdAt),
      modifiedAt: new Date(taskDto.modifiedAt),
    },
    id: id ? new UniqueEntityID(id) : undefined,
  };
}
