import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { lastValueFrom } from 'rxjs';
import { Change } from '../../models/change.model';
import { ClientChangesService } from '../api/client-changes.service';
import { ImageService } from './image.service';

export type MissingBlobDiscard = {
  taskId: string;
  imageId: string;
};

export type OutboundSyncResult = {
  sent: Change[];
  notFound: Change[];
  missingBlobDiscards: MissingBlobDiscard[];
  sendFailed: boolean;
};

@Injectable({ providedIn: 'root' })
export class OutboundSyncService {
  constructor(
    private readonly clientChangesService: ClientChangesService,
    private readonly imageService: ImageService,
  ) {}

  public async process(changes: Change[]): Promise<OutboundSyncResult> {
    const sent: Change[] = [];
    const notFound: Change[] = [];
    const discards: MissingBlobDiscard[] = [];
    const blockedTaskIds = new Set<string>();

    for (const change of changes) {
      const entityId = change.object?.id;
      if (entityId && blockedTaskIds.has(entityId)) {
        continue;
      }

      const imageId = this.taskImageIdToUpload(change);
      if (imageId) {
        const uploadResult = await this.imageService.ensureUploaded(imageId);
        if (uploadResult === 'failed') {
          if (entityId) {
            blockedTaskIds.add(entityId);
          }
          continue;
        }
        if (uploadResult === 'missingBlob') {
          if (entityId) {
            blockedTaskIds.add(entityId);
            discards.push({ taskId: entityId, imageId });
            await this.imageService.deleteImage(imageId);
          }
          continue;
        }
      }

      try {
        await lastValueFrom(this.clientChangesService.send(change));
        sent.push(change);
      } catch (error) {
        console.error('Sync Pending Change Error:', change, error);

        // TODO: Don't rely only on HTTP status code - check error name from backend response
        // TICKET: https://brainas.atlassian.net/browse/BA-258
        if (error instanceof HttpErrorResponse && error.status === 404) {
          notFound.push(change);
          continue;
        }

        return {
          sent,
          notFound,
          missingBlobDiscards: this.uniqueDiscards(discards),
          sendFailed: true,
        };
      }
    }

    return {
      sent,
      notFound,
      missingBlobDiscards: this.uniqueDiscards(discards),
      sendFailed: false,
    };
  }

  private taskImageIdToUpload(change: Change): string | undefined {
    if (change.entity !== EChangedEntity.Task || change.action === EChangeAction.Deleted) {
      return undefined;
    }
    const object = change.object;
    if (!object || !('imageId' in object)) {
      return undefined;
    }
    const imageId = (object as { imageId?: unknown }).imageId;
    return typeof imageId === 'string' && imageId.length > 0 ? imageId : undefined;
  }

  private uniqueDiscards(discards: MissingBlobDiscard[]): MissingBlobDiscard[] {
    return [...new Map(discards.map(discard => [discard.taskId, discard])).values()];
  }
}
