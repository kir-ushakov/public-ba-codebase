import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { CreateTask } from './create-task.usecase.js';
import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { Task } from '../../../../../shared/domain/models/task.js';
import { TaskMapper } from '../../../../../shared/mappers/task.mapper.js';
import { CreateTaskRequest, CreateTaskResult } from './create-task.contract.js';

export class CreateTaskController extends BaseController {
  private _useCase: CreateTask;

  constructor(useCase: CreateTask) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const requestBody: SendChangeContract.Request<TaskDTO> = req.body;

    // Build internal request by adding userId to external contract
    const request: CreateTaskRequest = {
      userId,
      ...requestBody,  // Spreads: { changeableObjectDto: TaskDTO }
    };

    try {
      const createResult: CreateTaskResult = await this._useCase.execute(request);

      if (createResult.isSuccess) {
        const createdTask = createResult.getValue() as Task;
        const response: SendChangeContract.Response<TaskDTO> = TaskMapper.toDTO(createdTask);
        BaseController.jsonResponse(res, EHttpStatus.Created, response);
      } else {
        const error = createResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err.toString());
    }
  }
}
