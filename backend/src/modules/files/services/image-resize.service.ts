import { GaxiosResponse } from "googleapis-common";
import sharp from "sharp";
import { Readable, PassThrough } from "stream";
import probe from "probe-image-size";

export class ImageResizeService {

   public async resizeImage(stream: Readable, width: number): Promise<{ resized: Readable, contentType: string }> {

    const passForProbe = new PassThrough();
    const passForResize = new PassThrough();

    stream.pipe(passForProbe);
    stream.pipe(passForResize);


    const probeResult = await probe(passForProbe);
    const aspectRatio = probeResult.height / probeResult.width;
    const height = Math.round(width * aspectRatio);
    const mime = probeResult.mime;
    

    const resized = passForResize.pipe(
      sharp().resize(width, height, { fit: "inside", fastShrinkOnLoad: true })
    );
    const contentType = mime;


    return { resized, contentType };
  }
}
