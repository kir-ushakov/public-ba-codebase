import { GetChnagesController } from './get-changes.controller.js';
import { GetChanges } from './get-changes.usecase.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { TaskRepoService } from '../../../../shared/repo/task-repo.service.js';
import { TagRepoService } from '../../../../shared/repo/tag-repo.service.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';
import { SyncRevisionService } from '../../../../shared/repo/sync-revision.service.js';

const taskRepoService = new TaskRepoService(models);
const tagRepoService = new TagRepoService(models);
const actionRepo = new ActionRepo(models);
const revisions = new SyncRevisionService(models);
const getChanges = new GetChanges(taskRepoService, tagRepoService, actionRepo, revisions);
const getChnagesController = new GetChnagesController(getChanges);

export { getChnagesController };
