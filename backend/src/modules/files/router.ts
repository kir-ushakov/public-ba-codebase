import { Router, NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { TaskConst } from '@brainassistant/contracts';
import { uploadImageController } from './usecases/upload-image/_index.js';
import { getImageController } from './usecases/get-image/_index.js';
import { uploadAudioController } from './usecases/upload-audio/index.js';
import { getAudioController } from './usecases/get-audio/index.js';
import { deleteAudioController } from './usecases/delete-audio/index.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from './config.js';
import { BaseController } from '../../shared/infra/http/models/base-controller.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';
import { UploadImageErrors } from './usecases/upload-image/upload-image.errors.js';
import { UploadAudioErrors } from './usecases/upload-audio/upload-audio.errors.js';
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

const audioUploader: multer.Multer = multer({
  dest: `${requiredEnv('FILES_UPLOAD_PATH')}/tmp/`,
  limits: { fileSize: TaskConst.AUDIO_MAX_BYTES },
});

filesRouter.post(
  '/audio',
  audioUploader.single('file'),
  asyncHandler(uploadAudioController.execute.bind(uploadAudioController)),
);

filesRouter.get(
  '/audio/:audioId',
  asyncHandler(getAudioController.execute.bind(getAudioController)),
);

filesRouter.delete(
  '/audio/:audioId',
  asyncHandler(deleteAudioController.execute.bind(deleteAudioController)),
);

filesRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  // User sent too much: this endpoint's contract, not infra. Multer enforces the
  // byte limit on the stream before execute(); we only attach FileTooLarge's description.
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    const error = _req.path.includes('/audio')
      ? UploadAudioErrors.FileTooLarge()
      : UploadImageErrors.FileTooLarge();
    return BaseController.jsonResponse(res, error.httpCode, {
      name: error.code,
      message: error.message,
    });
  }
  return next(err);
});

export { filesRouter };
