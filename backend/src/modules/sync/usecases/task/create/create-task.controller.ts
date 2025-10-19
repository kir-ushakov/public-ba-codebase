import { Request, Response } from 'express';
import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { CreateTask, CreateTaskParams, CreateTaskResult } from './create-task.usecase.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { Task } from '../../../../../shared/domain/models/task.js';
import { TaskMapper } from '../../../../../shared/mappers/task.mapper.js';

export class CreateTaskController extends BaseController {
  private _useCase: CreateTask;

  constructor(useCase: CreateTask) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const params: CreateTaskParams = this.requestToUsecaseParams(req.body, userId);

    try {
      const createResult: CreateTaskResult = await this._useCase.execute(params);

      if (createResult.isSuccess) {
        const response = this.usecaseResultToResponse(createResult);
        BaseController.jsonResponse(res, EHttpStatus.Created, response);
      } else {
        const error = createResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err.toString());
    }
  }

  private requestToUsecaseParams(payload: SendChangeContract.Request<TaskDTO>, userId: string): CreateTaskParams {
    const taskDto: TaskDTO = payload.changeableObjectDto;
    return {
      taskProps: {
        userId,
        ...taskDto,
      }
    };
  }

  private usecaseResultToResponse(result: CreateTaskResult): SendChangeContract.Response<TaskDTO> {
    return TaskMapper.toDTO(result.getValue() as Task);
  }
}
