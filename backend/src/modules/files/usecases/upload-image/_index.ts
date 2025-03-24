import { UploadImageController } from './upload-image.controller.js';
import { UploadImageUsecase } from './upload-image.usecase.js';
import { googleDriveService } from './../../../integrations/google/services/index.js';

const uploadImageUsecase = new UploadImageUsecase(googleDriveService);
const uploadImageController = new UploadImageController(uploadImageUsecase);
export { uploadImageController };
