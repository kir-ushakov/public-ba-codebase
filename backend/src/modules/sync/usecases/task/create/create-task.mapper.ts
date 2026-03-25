import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import type { CreateTaskParams } from './create-task.usecase.js';

export function requestToUsecaseParams(
  payload: SendChangeContract.Request<TaskDTO>,
  userId: string,
): CreateTaskParams {
  const taskDto: TaskDTO = payload.changeableObjectDto;
  const { id, ...taskPropsWithoutId } = taskDto;

  return {
    taskProps: {
      userId,
      ...taskPropsWithoutId,
      createdAt: new Date(taskDto.createdAt),
      modifiedAt: new Date(taskDto.modifiedAt),
    },
    id: id ? new UniqueEntityID(id) : undefined,
  };
}
