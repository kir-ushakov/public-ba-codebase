import { Router, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { uploadImageController } from './usecases/upload-image/_index.js';
import { getImageController } from './usecases/get-image/_index.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from './config.js';
import { BaseController } from '../../shared/infra/http/models/base-controller.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';
import { UploadImageErrors } from './usecases/upload-image/upload-image.errors.js';
import { requiredEnv } from '../../config/index.js';

const filesRouter: Router = Router();

const uploader: multer.Multer = multer({
  dest: `${requiredEnv('FILES_UPLOAD_PATH')}/tmp/`,
  limits: { fileSize: MAX_IMAGE_UPLOAD_FILE_BYTES },
});

filesRouter.post(
  '/image',
  uploader.single('file'),
  asyncHandler(uploadImageController.execute.bind(uploadImageController)),
);

filesRouter.get(
  '/image/:imageId',
  asyncHandler(getImageController.execute.bind(getImageController)),
);

filesRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  // User sent too much: this endpoint's contract, not infra. Multer enforces the
  // byte limit on the stream before execute(); we only attach FileTooLarge's description.
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    const error = UploadImageErrors.FileTooLarge();
    return BaseController.jsonResponse(res, error.httpCode, {
      name: error.code,
      message: error.message,
    });
  }
  return next(err);
});

export { filesRouter };
