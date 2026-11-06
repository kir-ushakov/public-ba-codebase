import { UploadImageController } from './upload-image.controller.js';
import { UploadImageUsecase } from './upload-image.usecase.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { imageResizeService, localImageStorage } from '../../services/_index.js';

const imageRepoService = new ImageRepoService(models);
const uploadImageUsecase = new UploadImageUsecase(
  localImageStorage,
  imageRepoService,
  imageResizeService,
);
const uploadImageController = new UploadImageController(uploadImageUsecase);
export { uploadImageController };
