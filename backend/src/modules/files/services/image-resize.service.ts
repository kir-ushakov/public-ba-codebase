import { GaxiosResponse } from "googleapis-common";
import sharp from "sharp";
import { Readable } from "stream";

export class ImageResizeService {

   public async resizeImage(file: GaxiosResponse<Readable>, width: number): Promise<GaxiosResponse<Readable>> {
    const stream = file.data;
    const buffer = await this.streamToBuffer(stream);
    const sharpObj = await sharp(buffer);
    const metadata = await sharpObj.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine image dimensions.");
    }
    
    const aspectRatio = metadata.height / metadata.width;

    //const format = metadata.format || "webp";
    const format =  "webp";
    console.log(format);
    const height = Math.round(width * aspectRatio);

    file.data = sharp(buffer).resize(width, height).webp();
    
    const headers = { ...file.headers };
    delete headers["content-length"];
    
    headers["content-type"] = "image/webp";
    file.headers = headers;

    return file;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
