import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { UpdateTagController } from './update-tag.controller.js';
import { UpdateTag } from './update-tag.usecase.js';

const tagRepoService = new TagRepoService(models);
const updateTag = new UpdateTag(tagRepoService);
const updateTagController = new UpdateTagController(updateTag);

export { updateTagController };
