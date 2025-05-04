import { Request, Response } from 'express';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { DeleteTaskRequestDTO } from './delete-task.dto.js';
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

    const deleteTaskDto: DeleteTaskRequestDTO = { id: req.params.taskId };

    try {
      const result = await this._useCase.execute({
        userId: userId,
        dto: deleteTaskDto,
      });
      if (result.isSuccess) {
        this.ok(res);
      } else {
        switch (result.error) {
          default:
            this.fail(res, result.error);
        }
      }
    } catch (err) {
      // TODO: handle unexpected error proper way
      // TICKET: https://brainas.atlassian.net/browse/BA-222
      console.error(err);
    }
  }
}
