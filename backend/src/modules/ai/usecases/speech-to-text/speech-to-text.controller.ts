import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { SpeechToText } from './speech-to-text.usecase.js';
import { SpeechToTextResponseDTO } from './speech-to-text.dto.js';

export class SpeechToTextController extends BaseController {
  private useCase: SpeechToText;

  constructor(useCase: SpeechToText) {
    super();
    this.useCase = useCase;
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

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        this.ok<SpeechToTextResponseDTO>(res, result.getValue());
      }
    } catch (err) {
      this.fail(res, err);
    }
  }
}
