import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { SpeechToTextRequestDTO, SpeechToTextResponseDTO } from './speech-to-text.dto.js';
import {
  OpenAISpeechTranscriberError,
  OpenAISpeechTranscriberService,
} from '../../services/open-ai-speech-transcriber.service.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ESpeechToTextUseCaseError, SpeechToTextErrors } from './speech-to-text.errors.js';

type SpeechToTextRequest = SpeechToTextRequestDTO;
type SpeechToTextResponse = Result<
  SpeechToTextResponseDTO | never,
  UseCaseError<ESpeechToTextUseCaseError>
>;

export class SpeechToText implements UseCase<SpeechToTextRequest, Promise<SpeechToTextResponse>> {
  constructor(private readonly openAISpeechTranscriberService: OpenAISpeechTranscriberService) {}

  public async execute(req: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    const textOrError = await this.openAISpeechTranscriberService.transcribeAudioFile(req.audio);
    if (textOrError.isFailure) {
      switch (textOrError.error.code) {
        case OpenAISpeechTranscriberError.UnsupportedType:
          return SpeechToTextErrors.UnsupportedMimeType(textOrError.error);
        default:
          return SpeechToTextErrors.TranscribeAudioFileFailed(textOrError.error);
      }
    }

    return Result.ok({
      transcript: textOrError.getValue(),
    });
  }
}
