import sharp from 'sharp';
import { Readable, PassThrough } from 'stream';
import probe from 'probe-image-size';
import { promises as fsp } from 'fs';

export class ImageResizeService {
  public async resizeImage(
    stream: Readable,
    width: number,
  ): Promise<{ resized: Readable; contentType: string }> {
    const passForProbe = new PassThrough();
    const passForResize = new PassThrough();

    stream.pipe(passForProbe);
    stream.pipe(passForResize);

    const probeResult = await probe(passForProbe);
    const aspectRatio = probeResult.height / probeResult.width;
    const height = Math.round(width * aspectRatio);
    const mime = probeResult.mime;

    const resized = passForResize.pipe(
      sharp().resize(width, height, { fit: 'inside', fastShrinkOnLoad: true }),
    );
    const contentType = mime;

    return { resized, contentType };
  }

  public async resizeImageToMaxSize(filePath: string, maxSiz: number): Promise<void> {
    try {
      // Resize image to a maximum of 1000px width or height (whichever is larger)
      // while maintaining the aspect ratio
      await sharp(filePath)
        .resize(maxSiz, maxSiz, {
          fit: 'inside',
          withoutEnlargement: true, // Don't enlarge images smaller than MAX_IMAGE_WIDTH
        })
        .toFile(`${filePath}.tmp`);

      // Replace the original file with the resized one
      await fsp.rename(`${filePath}.tmp`, filePath);
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  }
}
