import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export enum ERemoveFromSlackErrors {
  SlackOAuthAccessNotFound = 'SLACK_OAUTH_ACCESS_NOT_FOUND',
}

export namespace RemoveFromSlackErrors {
  export class SlackOAuthAccessNotFound extends Result<UseCaseError> {
    constructor() {
      super(
        false,
        new UseCaseError(
          EHttpStatus.NotFound,
          ERemoveFromSlackErrors.SlackOAuthAccessNotFound,
          'Slack OAuth Access Token Not Found'
        )
      );
    }
  }
}
