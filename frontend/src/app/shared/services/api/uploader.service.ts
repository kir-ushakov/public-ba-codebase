import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';
import { environment } from 'src/environments/environment';
import { ImageOptimizerService } from '../utility/image-optimizer.service';
import { firstValueFrom } from 'rxjs';

export type UploadImageResponseDTO = {
  fileId: string;
  extension: string;
};

@Injectable({
  providedIn: 'root',
})
export class UploaderService {
  public static readonly IMAGE_API_ENDPOINT = `${environment.baseUrl}files/image`;

  constructor(
    private http: HttpClient,
    private imageOptimizerService: ImageOptimizerService
  ) {}

  public async uploadImageFromBlobUri(
    imageUri: string,
    quality: number
  ): Promise<UploadImageResponseDTO> {
    try {
      const formData = await this.convertBlobUriToFormData(imageUri, quality);      

      return firstValueFrom(this.http
        .post<UploadImageResponseDTO>('/api/files/image', formData));
      } catch(error) {
        console.error('Error uploading image:', error);
        throw error;
      }
  }

  private async convertBlobUriToFormData(imageUri: string, quality: number): Promise<FormData> {
    /**
     * #NOTE:
     * We retrieve the Blob object from the URI with the fetch function.
     */
    const response = await fetch(imageUri);
    const blob = await response.blob();

    /**
     * #NOTE:
     * It's best to reduce the image size to avoid sending unnecessarily large files.
     */
    const reducedBlob = await this.imageOptimizerService.optimizeImage(blob, quality);
    /**
     * #NOTE: 
     * With the mime library define the correct file extension
     */
    const extension = mime.getExtension(reducedBlob.type) || 'jpg';
    /**
     * #NOTE:
     * Create a unique name for the image by generating a random id using the uuid function
     */
    const filename = `${uuidv4()}.${extension}`;

    /**
     * #NOTE: 
     * Finally, we build a FormData object using the Blob to prepare it for upload
     */
    const formData = new FormData();
    formData.append('file', reducedBlob, filename);

    return formData;
  }
}
