import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { SpeechToText } from './speech-to-text.usecase.js';
import { SpeechToTextResponseDTO } from './speech-to-text.dto.js';
import { LoggerService } from '../../../../shared/services/logger/logger.service.js';

export class SpeechToTextController extends BaseController {
  private useCase: SpeechToText;
  private logger: LoggerService;

  constructor(useCase: SpeechToText, logger: LoggerService) {
    super();
    this.useCase = useCase;
    this.logger = logger;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const audioBuffer = file.buffer;
    const mimeType = file.mimetype;
    const audio = new Blob([audioBuffer], { type: mimeType });
    const dto = { audio };

    try {
      const result = await this.useCase.execute(dto);

      if (result.isFailure) {
        const error = result.error;

        this.logger.logServiceError(error);

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        this.ok<SpeechToTextResponseDTO>(res, result.getValue());
      }
    } catch (err) {
      this.logger.logUnexpectedError(err);
      this.fail(res, err);
    }
  }
}
