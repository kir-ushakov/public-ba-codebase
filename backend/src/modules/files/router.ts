import { Router } from 'express';
import multer from 'multer';
import { uploadImageController } from './usecases/upload-image/_index.js';
import { getImageController } from './usecases/get-image/_index.js';

const filesRouter: Router = Router();

const uploader: multer.Multer = multer({
  dest: process.env.FILES_UPLOAD_PATH + '/tmp/',
});

filesRouter.post('/image', uploader.single('file'), (req, res, next) =>
  uploadImageController.execute(req, res, next)
);

filesRouter.get('/image/:file', (req, res, next) =>
  getImageController.execute(req, res, next)
);

export { filesRouter };
