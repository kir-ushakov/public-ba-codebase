import { Request, Response } from 'express';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { UpdateTask } from './update-task.usecase.js';

export class UpdateTaskController extends BaseController {
  private _useCase: UpdateTask;

  constructor(useCase: UpdateTask) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const taskDto = req.body.changeableObjectDto;

    try {
      const result = await this._useCase.execute({
        userId: userId,
        dto: taskDto,
      });

      if (result.isSuccess) {
        this.ok(res);
      } else {
        const error = result.error;

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
