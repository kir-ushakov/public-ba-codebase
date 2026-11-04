import { DeleteImageController } from './delete-image.controller.js';
import { DeleteImageUsecase } from './delete-image.usecase.js';
import { localImageStorage } from '../../services/_index.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';

const imageRepo = new ImageRepoService(models);
const deleteImageUsecase = new DeleteImageUsecase(imageRepo, localImageStorage);
const deleteImageController = new DeleteImageController(deleteImageUsecase);

export { deleteImageController };
