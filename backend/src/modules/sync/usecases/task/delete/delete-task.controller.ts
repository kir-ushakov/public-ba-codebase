import { Request, Response } from 'express';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { DeleteTaskUsecase } from './delete-task.usecase.js';

export class DeleteTaskController extends BaseController {
  private _useCase: DeleteTaskUsecase;

  constructor(useCase: DeleteTaskUsecase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const taskId = req.params.taskId;
      if (!taskId) {
        this.fail(res, 'taskId is required');
        return;
      }
      const result = await this._useCase.execute({
        userId,
        taskId,
      });
      if (result.isSuccess) {
        this.ok(res);
        return;
      }
      const error = result.error;
      BaseController.jsonResponse(res, error.httpCode, {
        name: error.code,
        message: error.message,
      });
    } catch (err) {
      // TODO: handle unexpected error proper way
      // TICKET: https://brainas.atlassian.net/browse/BA-222
      console.error(err);
    }
  }
}
