import { SendChangeContract, TagDTO } from '@brainassistant/contracts';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import type { CreateTagParams } from './create-tag.usecase.js';

export function requestToUsecaseParams(
  payload: SendChangeContract.Request<TagDTO>,
  userId: string,
): CreateTagParams {
  const tagDto: TagDTO = payload.changeableObjectDto;

  return {
    tagProps: {
      userId,
      isCategory: tagDto.isCategory,
      name: tagDto.name,
      color: tagDto.color,
    },
    id: tagDto.id ? new UniqueEntityID(tagDto.id) : undefined,
  };
}
