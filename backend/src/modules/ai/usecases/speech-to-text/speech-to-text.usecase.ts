import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { SpeechToTextRequestDTO, SpeechToTextResponseDTO } from './speech-to-text.dto.js';
import { EOpenAIServiceError, OpenAIService } from '../../services/open-ai.service.js';
import { SpeechToTextError, SpeechToTextErrors } from './speech-to-text.errors.js';

type SpeechToTextRequest = SpeechToTextRequestDTO;
type SpeechToTextResponse = Result<SpeechToTextResponseDTO | never, SpeechToTextError>;

export class SpeechToText implements UseCase<SpeechToTextRequest, Promise<SpeechToTextResponse>> {
  constructor(private readonly openAIService: OpenAIService) {}

  public async execute(req: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    const textOrError = await this.openAIService.transcribeAudioFile(req.file);
    if (textOrError.isFailure) {
      switch (textOrError.error.code) {
        case EOpenAIServiceError.UnsupportedType:
          return new SpeechToTextErrors.UnsupportedMimeType(textOrError.error);
        case EOpenAIServiceError.TranscriptAPIRequestFailed:
          return new SpeechToTextErrors.TranscribeAudioFileFailed(textOrError.error);
      }
    }

    return Result.ok({
      transcript: textOrError.getValue(),
    });
  }
}
