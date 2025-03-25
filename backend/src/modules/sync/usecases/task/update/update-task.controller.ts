import { Request, Response } from 'express';
import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { UpdateTask } from './update-task.usecase.js';

export class UpdateTaskController extends BaseController {
  private _useCase: UpdateTask;

  constructor(useCase: UpdateTask) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const taskDto = req.body.changeableObjectDto;

    try {
      const result: Result<any> = await this._useCase.execute({
        userId: userId,
        dto: taskDto,
      });

      if (result.isSuccess) {
        return this.ok(res);
      } else {
        const error: UseCaseError = result.error as UseCaseError;

        return BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
