import { Request, Response } from 'express';
import { Result } from '../../../../../shared/core/Result.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { DeleteTaskRequestDTO } from './delete-task.dto.js';
import { DeleteTaskUsecase } from './delete-task.usecase.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';

export class DeleteTaskController extends BaseController {
  private _useCase: DeleteTaskUsecase;

  constructor(useCase: DeleteTaskUsecase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const deleteTaskDto: DeleteTaskRequestDTO = { id: req.params.taskId };

    try {
      const result: Result<any> = await this._useCase.execute({
        userId: userId,
        dto: deleteTaskDto,
      });
      if (result.isSuccess) {
        return this.ok(res);
      } else {
        const error: UseCaseError = result.error as UseCaseError;
        switch (result.error) {
          default:
            return this.fail(res, result.error);
        }
      }
    } catch (err) {}
  }
}
