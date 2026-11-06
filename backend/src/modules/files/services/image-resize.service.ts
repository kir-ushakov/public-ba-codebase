import path from 'path';
import sharp from 'sharp';
import { Readable, PassThrough } from 'stream';
import probe from 'probe-image-size';
import { promises as fsp } from 'fs';
import { ImageConst } from '@brainassistant/contracts';

export class ImageResizeService {
  public async resizeImage(
    stream: Readable,
    width: number,
  ): Promise<{ resized: Readable; contentType: string }> {
    const passForProbe = new PassThrough();
    const passForResize = new PassThrough();

    stream.pipe(passForProbe);
    stream.pipe(passForResize);

    // sharp must be draining its branch before probe is awaited: an idle branch fills up,
    // pauses the shared source, and probe then never sees enough bytes to resolve.
    const resized = passForResize.pipe(
      sharp().resize({ width, fit: 'inside', fastShrinkOnLoad: true }),
    );
    const { mime: contentType } = await probe(passForProbe);

    return { resized, contentType };
  }

  /**
   * Returns the path to upload. A WebP already inside the store limits is left
   * untouched. Anything else is encoded once to lossy WebP under those limits.
   */
  public async prepareForStore(filePath: string): Promise<string> {
    if (await this.alreadyWithinStoreLimits(filePath)) {
      return filePath;
    }

    const destination = webpDestination(filePath);
    const tempPath = `${destination}.encoding`;

    try {
      for (const [longEdge, quality] of ImageConst.ENCODE_PLAN) {
        await fsp.rm(tempPath, { force: true });
        await sharp(filePath)
          .rotate()
          .resize(longEdge, longEdge, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality })
          .toFile(tempPath);

        // eslint-disable-next-line security/detect-non-literal-fs-filename -- upload pipeline path under controlled temp dir
        const bytes = (await fsp.stat(tempPath)).size;
        if (bytes <= ImageConst.MAX_BYTES) {
          await this.commitEncoded(filePath, destination, tempPath);
          return destination;
        }
      }
    } catch (error) {
      await fsp.rm(tempPath, { force: true });
      throw error;
    }

    await fsp.rm(tempPath, { force: true });
    throw new Error('Image exceeds the store size limit');
  }

  private async alreadyWithinStoreLimits(filePath: string): Promise<boolean> {
    // From a buffer, not the path: libvips keeps a path open in its cache, and on Windows the
    // kept file can then not be renamed into storage (EBUSY).
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- upload pipeline path under controlled temp dir
    const file = await fsp.readFile(filePath);
    const metadata = await sharp(file).metadata();
    const longEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
    return (
      metadata.format === 'webp' &&
      longEdge > 0 &&
      longEdge <= ImageConst.MAX_LONG_EDGE_PX &&
      file.length <= ImageConst.MAX_BYTES
    );
  }

  private async commitEncoded(
    source: string,
    destination: string,
    tempPath: string,
  ): Promise<void> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- upload pipeline path under controlled temp dir
    await fsp.unlink(source);
    if (source !== destination) {
      await fsp.rm(destination, { force: true });
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- upload pipeline path under controlled temp dir
    await fsp.rename(tempPath, destination);
  }
}

function webpDestination(filePath: string): string {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}.webp`);
}
