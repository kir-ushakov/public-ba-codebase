import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { of, Subject, throwError } from 'rxjs';
import { Change } from 'src/app/shared/models/change.model';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { ClientChangesService } from 'src/app/shared/services/api/client-changes.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { OutboundSyncService } from 'src/app/shared/services/application/outbound-sync.service';

describe('OutboundSyncService', () => {
  let service: OutboundSyncService;
  let clientChangesService: { send: jest.Mock };
  let imageService: { ensureUploaded: jest.Mock; deleteImage: jest.Mock };

  const pendingChange: Change = {
    entity: EChangedEntity.Task,
    action: EChangeAction.Created,
    object: { id: 'task-1', modifiedAt: '2025-01-15T12:00:00.000Z' },
  };

  const taskWithPhoto: Task = {
    id: 'task-photo',
    userId: 'user-1',
    type: ETaskType.Basic,
    title: 'Photo task',
    imageId: 'img-1',
    status: ETaskStatus.Todo,
    createdAt: '2025-01-15T12:00:00.000Z',
    modifiedAt: '2025-01-15T12:00:00.000Z',
  };

  const photoCreate: Change = {
    entity: EChangedEntity.Task,
    action: EChangeAction.Created,
    object: taskWithPhoto,
  };

  beforeEach(() => {
    clientChangesService = { send: jest.fn(() => of({})) };
    imageService = {
      ensureUploaded: jest.fn().mockResolvedValue('alreadyRemote'),
      deleteImage: jest.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        OutboundSyncService,
        { provide: ClientChangesService, useValue: clientChangesService },
        { provide: ImageService, useValue: imageService },
      ],
    });
    service = TestBed.inject(OutboundSyncService);
  });

  it('sends a change that has no image to upload', async () => {
    const result = await service.process([pendingChange]);

    expect(imageService.ensureUploaded).not.toHaveBeenCalled();
    expect(clientChangesService.send).toHaveBeenCalledWith(pendingChange);
    expect(result).toEqual({
      sent: [pendingChange],
      notFound: [],
      missingBlobDiscards: [],
      sendFailed: false,
    });
  });

  it('uploads a local image before sending the task change', async () => {
    imageService.ensureUploaded.mockResolvedValue('uploaded');

    const result = await service.process([photoCreate]);

    expect(imageService.ensureUploaded).toHaveBeenCalledWith('img-1');
    expect(imageService.ensureUploaded.mock.invocationCallOrder[0]).toBeLessThan(
      clientChangesService.send.mock.invocationCallOrder[0],
    );
    expect(result.sent).toEqual([photoCreate]);
  });

  it('sends immediately when the image is already remote', async () => {
    imageService.ensureUploaded.mockResolvedValue('alreadyRemote');

    const result = await service.process([photoCreate]);

    expect(imageService.ensureUploaded).toHaveBeenCalledWith('img-1');
    expect(clientChangesService.send).toHaveBeenCalledWith(photoCreate);
    expect(result.sent).toEqual([photoCreate]);
  });

  it('skips a task whose image failed to upload and still sends later unrelated changes', async () => {
    const other: Change = {
      entity: EChangedEntity.Task,
      action: EChangeAction.Created,
      object: { id: 'task-b', modifiedAt: 't' },
    };
    const laterUpdate: Change = {
      entity: EChangedEntity.Task,
      action: EChangeAction.Updated,
      object: { ...taskWithPhoto, title: 'Updated' },
    };
    imageService.ensureUploaded.mockResolvedValue('failed');

    const result = await service.process([photoCreate, laterUpdate, other]);

    expect(clientChangesService.send).toHaveBeenCalledTimes(1);
    expect(clientChangesService.send).toHaveBeenCalledWith(other);
    expect(result.sent).toEqual([other]);
    expect(result.sendFailed).toBe(false);
  });

  it('does not send a task whose image blob is missing and deletes the local file', async () => {
    imageService.ensureUploaded.mockResolvedValue('missingBlob');

    const result = await service.process([photoCreate]);

    expect(clientChangesService.send).not.toHaveBeenCalled();
    expect(imageService.deleteImage).toHaveBeenCalledWith('img-1');
    expect(result.missingBlobDiscards).toEqual([{ taskId: 'task-photo', imageId: 'img-1' }]);
  });

  it('stops the queue on a non-404 send error', async () => {
    const first: Change = { ...pendingChange, object: { id: 'task-a', modifiedAt: 't' } };
    const second: Change = { ...pendingChange, object: { id: 'task-b', modifiedAt: 't' } };
    clientChangesService.send.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
    );

    const result = await service.process([first, second]);

    expect(clientChangesService.send).toHaveBeenCalledTimes(1);
    expect(result.sent).toEqual([]);
    expect(result.sendFailed).toBe(true);
  });

  it('records a 404 send as notFound and continues', async () => {
    const first: Change = { ...pendingChange, object: { id: 'task-a', modifiedAt: 't' } };
    const second: Change = { ...pendingChange, object: { id: 'task-b', modifiedAt: 't' } };
    clientChangesService.send
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
      )
      .mockReturnValue(of({}));

    const result = await service.process([first, second]);

    expect(result.notFound).toEqual([first]);
    expect(result.sent).toEqual([second]);
    expect(result.sendFailed).toBe(false);
  });

  it('does not start the next send while one is in flight', async () => {
    const first: Change = { ...pendingChange, object: { id: 'task-a', modifiedAt: 't' } };
    const second: Change = { ...pendingChange, object: { id: 'task-b', modifiedAt: 't' } };
    const sendGate = new Subject<unknown>();
    clientChangesService.send.mockReturnValueOnce(sendGate.asObservable()).mockReturnValue(of({}));

    const done = service.process([first, second]);

    await Promise.resolve();
    await Promise.resolve();

    expect(clientChangesService.send).toHaveBeenCalledTimes(1);
    expect(clientChangesService.send).toHaveBeenCalledWith(first);

    sendGate.next({});
    sendGate.complete();
    await expect(done).resolves.toEqual({
      sent: [first, second],
      notFound: [],
      missingBlobDiscards: [],
      sendFailed: false,
    });
    expect(clientChangesService.send).toHaveBeenCalledTimes(2);
  });
});
