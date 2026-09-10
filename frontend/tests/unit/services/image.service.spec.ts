import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { throwError } from 'rxjs';
import { EUploadImageUseCaseError } from '@brainassistant/contracts';
import { ImageUploaderService } from 'src/app/shared/services/api/image-uploader.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { UuidGeneratorService } from 'src/app/shared/services/adapters/uuid-generator.service';
import { ImageDbService } from 'src/app/shared/services/infrastructure/image-db.service';
import { FetchService } from 'src/app/shared/services/infrastructure/fetch.service';
import { ImageOptimizerService } from 'src/app/shared/services/utility/image-optimizer.service';
import { AppAction } from 'src/app/shared/state/app.actions';

describe('ImageService', () => {
  let imageDbService: { getAllUnuploadedImages: jest.Mock; updateImage: jest.Mock };
  let imageUploaderService: { uploadImageBlob: jest.Mock };
  let http: { get: jest.Mock };
  let store: { dispatch: jest.Mock };
  let service: ImageService;

  beforeEach(() => {
    imageDbService = {
      getAllUnuploadedImages: jest.fn(),
      updateImage: jest.fn(),
    };
    imageUploaderService = { uploadImageBlob: jest.fn() };
    http = { get: jest.fn(() => throwError(() => new HttpErrorResponse({ status: 403 }))) };
    store = { dispatch: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ImageService,
        { provide: ImageDbService, useValue: imageDbService },
        { provide: ImageUploaderService, useValue: imageUploaderService },
        { provide: ImageOptimizerService, useValue: {} },
        { provide: FetchService, useValue: {} },
        { provide: UuidGeneratorService, useValue: {} },
        { provide: Store, useValue: store },
        { provide: HttpClient, useValue: http },
      ],
    });
    service = TestBed.inject(ImageService);
  });

  it('dispatches GoogleRefreshTokenInvalid when upload returns that 403', async () => {
    imageDbService.getAllUnuploadedImages.mockResolvedValue([
      { id: 'img-1', blob: new Blob(['x']), uploaded: false },
    ]);
    imageUploaderService.uploadImageBlob.mockRejectedValue(
      new HttpErrorResponse({
        status: 403,
        error: {
          name: EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
          message: 'Google refresh token is invalid or revoked',
        },
      }),
    );

    await service.uploadImages();

    expect(store.dispatch).toHaveBeenCalledWith(expect.any(AppAction.GoogleRefreshTokenInvalid));
    expect(imageDbService.updateImage).not.toHaveBeenCalled();
  });

  it('probes the files API only once when several thumbnails fail', () => {
    service.probeRemoteImage('img-1');
    service.probeRemoteImage('img-2');

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/files/image/img-1', { responseType: 'blob' });
  });
});
