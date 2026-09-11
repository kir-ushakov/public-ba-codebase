import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { ImageUploaderService } from 'src/app/shared/services/api/image-uploader.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { UuidGeneratorService } from 'src/app/shared/services/adapters/uuid-generator.service';
import { ImageDbService } from 'src/app/shared/services/infrastructure/image-db.service';
import { FetchService } from 'src/app/shared/services/infrastructure/fetch.service';
import { ImageOptimizerService } from 'src/app/shared/services/utility/image-optimizer.service';

describe('ImageService', () => {
  let imageDbService: {
    getImage: jest.Mock;
    updateImage: jest.Mock;
    deleteImage: jest.Mock;
  };
  let imageUploaderService: { uploadImageBlob: jest.Mock };
  let http: { get: jest.Mock };
  let service: ImageService;

  beforeEach(() => {
    imageDbService = {
      getImage: jest.fn(),
      updateImage: jest.fn(),
      deleteImage: jest.fn(),
    };
    imageUploaderService = { uploadImageBlob: jest.fn() };
    http = { get: jest.fn(() => throwError(() => new HttpErrorResponse({ status: 403 }))) };

    TestBed.configureTestingModule({
      providers: [
        ImageService,
        { provide: ImageDbService, useValue: imageDbService },
        { provide: ImageUploaderService, useValue: imageUploaderService },
        { provide: ImageOptimizerService, useValue: {} },
        { provide: FetchService, useValue: {} },
        { provide: UuidGeneratorService, useValue: {} },
        { provide: HttpClient, useValue: http },
      ],
    });
    service = TestBed.inject(ImageService);
  });

  it('uploads a local blob and marks it uploaded', async () => {
    const blob = new Blob(['x']);
    imageDbService.getImage.mockResolvedValue({ id: 'img-1', blob, uploaded: false });
    imageUploaderService.uploadImageBlob.mockResolvedValue({ imageId: 'img-1' });

    await expect(service.ensureUploaded('img-1')).resolves.toBe('uploaded');

    expect(imageUploaderService.uploadImageBlob).toHaveBeenCalledWith('img-1', blob);
    expect(imageDbService.updateImage).toHaveBeenCalledWith('img-1', { uploaded: true });
  });

  it('does not upload when the image is already marked uploaded', async () => {
    imageDbService.getImage.mockResolvedValue({
      id: 'img-1',
      blob: new Blob(['x']),
      uploaded: true,
    });

    await expect(service.ensureUploaded('img-1')).resolves.toBe('alreadyRemote');
    expect(imageUploaderService.uploadImageBlob).not.toHaveBeenCalled();
  });

  it('does not upload when there is no local record', async () => {
    imageDbService.getImage.mockResolvedValue(undefined);

    await expect(service.ensureUploaded('img-1')).resolves.toBe('alreadyRemote');
    expect(imageUploaderService.uploadImageBlob).not.toHaveBeenCalled();
  });

  it('returns missingBlob when the local record has no file', async () => {
    imageDbService.getImage.mockResolvedValue({ id: 'img-1', uploaded: false });

    await expect(service.ensureUploaded('img-1')).resolves.toBe('missingBlob');
    expect(imageUploaderService.uploadImageBlob).not.toHaveBeenCalled();
  });

  it('returns failed when upload rejects', async () => {
    imageDbService.getImage.mockResolvedValue({
      id: 'img-1',
      blob: new Blob(['x']),
      uploaded: false,
    });
    imageUploaderService.uploadImageBlob.mockRejectedValue(
      new HttpErrorResponse({ status: 500, statusText: 'Server Error' }),
    );

    await expect(service.ensureUploaded('img-1')).resolves.toBe('failed');
    expect(imageDbService.updateImage).not.toHaveBeenCalled();
  });

  it('shares one in-flight upload across concurrent ensureUploaded calls', async () => {
    imageDbService.getImage.mockResolvedValue({
      id: 'img-1',
      blob: new Blob(['x']),
      uploaded: false,
    });
    let resolveUpload: (value: { imageId: string }) => void = () => undefined;
    imageUploaderService.uploadImageBlob.mockReturnValue(
      new Promise<{ imageId: string }>(resolve => {
        resolveUpload = resolve;
      }),
    );

    const first = service.ensureUploaded('img-1');
    const second = service.ensureUploaded('img-1');

    await Promise.resolve();
    await Promise.resolve();
    expect(imageUploaderService.uploadImageBlob).toHaveBeenCalledTimes(1);

    resolveUpload({ imageId: 'img-1' });
    await expect(Promise.all([first, second])).resolves.toEqual(['uploaded', 'uploaded']);
    expect(imageUploaderService.uploadImageBlob).toHaveBeenCalledTimes(1);
  });

  it('probes the files API only once when several thumbnails fail', () => {
    service.probeRemoteImage('img-1');
    service.probeRemoteImage('img-2');

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/files/image/img-1', { responseType: 'blob' });
  });
});
