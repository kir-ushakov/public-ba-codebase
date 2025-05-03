import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { CreateTask } from './create-task.usecase.js';
import { CreateTaskRequestDTO } from './create-task.dto.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { Task } from '../../../../../shared/domain/models/task.js';

export class CreateTaskController extends BaseController {
  private _useCase: CreateTask;

  constructor(useCase: CreateTask) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void | any> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const task = req.body.changeableObjectDto;

    const dto: CreateTaskRequestDTO = {
      id: task.id.toString(),
      ...task.toPrimitives(),
    };

    try {
      const createResult = await this._useCase.execute({
        userId,
        dto,
      });

      if (createResult.isSuccess) {
        const createdTaks = createResult.getValue() as Task;
        return BaseController.jsonResponse(res, EHttpStatus.Created, createdTaks);
      } else {
        const error = createResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
