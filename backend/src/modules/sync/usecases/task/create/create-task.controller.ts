import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { CreateTask } from './create-task.usecase.js';
import { CreateTaskRequestDTO } from './create-task.dto.js';
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

    const task = req.body.changeableObjectDto;

    const dto: CreateTaskRequestDTO = {
      ...task,
      id: task.id.toString(),
    };

    try {
      const createResult = await this._useCase.execute({
        userId,
        dto,
      });

      if (createResult.isSuccess) {
        const createdTaks = createResult.getValue() as Task;
        const createTakResponseDTO = TaskMapper.toDTO(createdTaks);
        BaseController.jsonResponse(res, EHttpStatus.Created, createTakResponseDTO);
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
