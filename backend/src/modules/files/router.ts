import { Router } from 'express';
import multer from 'multer';
import { uploadImageController } from './usecases/upload-image/_index.js';
import { getImageController } from './usecases/get-image/_index.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from './config.js';

const filesRouter: Router = Router();

const uploader: multer.Multer = multer({
  dest: process.env.FILES_UPLOAD_PATH + '/tmp/',
  limits: { fileSize: MAX_IMAGE_UPLOAD_FILE_BYTES },
});

filesRouter.post('/image', uploader.single('file'), (req, res, next) =>
  uploadImageController.execute(req, res, next),
);

filesRouter.get('/image/:imageId', (req, res, next) => getImageController.execute(req, res, next));

export { filesRouter };
