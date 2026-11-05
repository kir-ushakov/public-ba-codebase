import { SendChangeContract, TagDTO } from '@brainassistant/contracts';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import type { UpdateTagParams } from './update-tag.usecase.js';

export function requestToUsecaseParams(
  payload: SendChangeContract.Request<TagDTO>,
  userId: string,
): UpdateTagParams {
  const tagDto: TagDTO = payload.changeableObjectDto;

  return {
    userId,
    id: new UniqueEntityID(tagDto.id),
    tagProps: {
      userId,
      name: tagDto.name,
      color: tagDto.color,
      isPinned: tagDto.isPinned === true,
      createdAt: new Date(tagDto.createdAt),
      modifiedAt: new Date(tagDto.modifiedAt),
    },
  };
}
