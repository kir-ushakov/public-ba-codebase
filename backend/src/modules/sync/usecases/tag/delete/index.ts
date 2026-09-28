import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { DeleteTagController } from './delete-tag.controller.js';
import { DeleteTagUsecase } from './delete-tag.usecase.js';

const tagRepoService = new TagRepoService(models);
const taskRepoService = new TaskRepoService(models);
const actionRepo = new ActionRepo(models);
const deleteTag = new DeleteTagUsecase(tagRepoService, taskRepoService, actionRepo);
const deleteTagController = new DeleteTagController(deleteTag);

export { deleteTagController };
