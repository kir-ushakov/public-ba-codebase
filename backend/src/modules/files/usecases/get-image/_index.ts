import { GetImageController } from './get-image.controller.js';
import { GetImageUsecase } from './get-image.usecase.js';
import { googleDriveService } from './../../../integrations/google/services/index.js';
import { imageResizeService } from '../../services/_index.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';

const imageRepoService = new ImageRepoService(models);

const getImageUsecase = new GetImageUsecase(
  googleDriveService,
  imageResizeService,
  imageRepoService,
);
const getImageController = new GetImageController(getImageUsecase);

export { getImageController };
