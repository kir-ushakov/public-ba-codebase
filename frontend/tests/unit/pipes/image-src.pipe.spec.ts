import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { ImageSrcPipe } from 'src/app/shared/pipes/image-src.pipe';

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('ImageSrcPipe', () => {
  let pipe: ImageSrcPipe;
  let imageService: { getImageRecord: jest.Mock };
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  const localBlob = new Blob(['local']);
  const otherBlob = new Blob(['other']);

  beforeEach(() => {
    imageService = { getImageRecord: jest.fn() };
    createObjectURL = jest.fn((blob: Blob) => `blob:${blob === localBlob ? 'local' : 'other'}`);
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });

    TestBed.configureTestingModule({
      providers: [
        ImageSrcPipe,
        { provide: ImageService, useValue: imageService },
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustUrl: (url: string) => url } },
      ],
    });
    pipe = TestBed.inject(ImageSrcPipe);
  });

  it('returns null when there is no image id', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(imageService.getImageRecord).not.toHaveBeenCalled();
  });

  it('uses the IndexedDB blob and skips HTTP when the image is on the device', async () => {
    imageService.getImageRecord.mockResolvedValue({ id: 'img-1', blob: localBlob, uploaded: true });

    expect(pipe.transform('img-1')).toBeNull();
    await flushMicrotasks();

    expect(pipe.transform('img-1')).toBe('blob:local');
    expect(createObjectURL).toHaveBeenCalledWith(localBlob);
  });

  it('returns the files API URL when IndexedDB has no blob', async () => {
    imageService.getImageRecord.mockResolvedValue(undefined);

    pipe.transform('img-1', 80);
    await flushMicrotasks();

    expect(pipe.transform('img-1', 80)).toBe('/api/files/image/img-1?width=80');
  });

  it('does not start a second load for the same id', async () => {
    imageService.getImageRecord.mockResolvedValue({
      id: 'img-1',
      blob: localBlob,
      uploaded: false,
    });

    pipe.transform('img-1');
    pipe.transform('img-1');
    await flushMicrotasks();

    expect(imageService.getImageRecord).toHaveBeenCalledTimes(1);
  });

  it('drops a stale load when the id changes before IndexedDB answers', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined;
    imageService.getImageRecord
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValue({ id: 'img-2', blob: otherBlob, uploaded: true });

    pipe.transform('img-1');
    pipe.transform('img-2');
    resolveFirst({ id: 'img-1', blob: localBlob, uploaded: true });
    await flushMicrotasks();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(otherBlob);
    expect(pipe.transform('img-2')).toBe('blob:other');
  });

  it('clears src when IndexedDB lookup fails', async () => {
    imageService.getImageRecord.mockRejectedValue(new Error('db'));

    pipe.transform('img-1');
    await flushMicrotasks();

    expect(pipe.transform('img-1')).toBeNull();
  });

  it('revokes the object URL on destroy', async () => {
    imageService.getImageRecord.mockResolvedValue({
      id: 'img-1',
      blob: localBlob,
      uploaded: true,
    });
    pipe.transform('img-1');
    await flushMicrotasks();

    pipe.ngOnDestroy();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local');
  });
});
