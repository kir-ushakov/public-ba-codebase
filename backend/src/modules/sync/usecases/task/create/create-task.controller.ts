import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { CreateTaskUC } from './create-task.usecase.js';
import { CreateTaskRequestDTO } from './create-task.dto.js';
import { Result } from '../../../../../shared/core/Result.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { Task } from '../../../../../shared/domain/models/task.js';

export class CreateTaskController extends BaseController {
  private _useCase: CreateTaskUC;

  constructor(useCase: CreateTaskUC) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const task = req.body.changeableObjectDto;

    const dto: CreateTaskRequestDTO = {
      userId: userId,
      id: task.id,
      type: task.type,
      title: task.title,
      status: task.status,
      imageUri: task.imageUri,
      createdAt: new Date(task.createdAt),
      modifiedAt: new Date(task.modifiedAt),
    };

    try {
      const createResult: Result<Task | UseCaseError> =
        await this._useCase.execute(dto);

      if (createResult.isSuccess) {
        const createdTaks = createResult.getValue() as Task;
        return BaseController.jsonResponse(
          res,
          EHttpStatus.Created,
          createdTaks
        );
      } else {
        const error: UseCaseError = createResult.error as UseCaseError;
        BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
