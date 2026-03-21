import { Router } from 'express';
import { speechToTextController } from './usecases/speech-to-text/index.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';
import multer from 'multer';
import { MAX_AUDIO_UPLOAD_FILE_BYTES, MAX_AUDIO_UPLOAD_FILES_COUNT } from './ai.conf.js';

const aIRouter: Router = Router();

const upload = multer({
  limits: {
    fileSize: MAX_AUDIO_UPLOAD_FILE_BYTES,
    files: MAX_AUDIO_UPLOAD_FILES_COUNT,
  },
});

aIRouter.post(
  '/speech-to-text',
  upload.single('file'),
  asyncHandler(speechToTextController.execute.bind(speechToTextController)),
);

export { aIRouter };
