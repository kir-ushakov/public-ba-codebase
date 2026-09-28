import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { CreateTagController } from './create-tag.controller.js';
import { CreateTag } from './create-tag.usecase.js';

const tagRepoService = new TagRepoService(models);
const createTag = new CreateTag(tagRepoService);
const createTagController = new CreateTagController(createTag);

export { createTagController };
