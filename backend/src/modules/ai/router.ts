import { Router } from 'express';
import { speechToTextController } from './usecases/speech-to-text/index.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';
import multer from 'multer';

const aIRouter: Router = Router();

const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;

const upload = multer({
  limits: {
    fileSize: MAX_AUDIO_UPLOAD_BYTES,
    files: 1,
  },
});

aIRouter.post(
  '/speech-to-text',
  upload.single('file'),
  asyncHandler(speechToTextController.execute.bind(speechToTextController)),
);

export { aIRouter };
