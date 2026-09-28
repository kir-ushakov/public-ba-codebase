import { Request, Response } from 'express';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';
import { DeleteTagUsecase } from './delete-tag.usecase.js';

export class DeleteTagController extends BaseController {
  constructor(private readonly useCase: DeleteTagUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const tagId = req.params.tagId;
      if (!tagId) {
        this.fail(res, 'tagId is required');
        return;
      }
      const result = await this.useCase.execute({
        userId,
        tagId,
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
      console.error(err);
    }
  }
}
