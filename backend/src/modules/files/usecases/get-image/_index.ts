import { GetImageController } from './get-image.controller.js';
import { GetImageUsecase } from './get-image.usecase.js';
import { googleDriveService } from './../../../integrations/google/services/index.js';
import { imageResizeService } from '../../services/_index.js';

const getImageUsecase = new GetImageUsecase(googleDriveService, imageResizeService);
const getImageController = new GetImageController(getImageUsecase);

export { getImageController };
