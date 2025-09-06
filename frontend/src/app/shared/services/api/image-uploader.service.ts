import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';

export type UploadImageResponseDTO = {
  fileId: string;
  extension: string;
};

@Injectable({
  providedIn: 'root',
})
export class ImageUploaderService {
  public static readonly IMAGE_API_ENDPOINT = `${environment.baseUrl}files/image`;

  constructor(private http: HttpClient) {}

  public async uploadImageBlob(imageId: string, blob: Blob): Promise<UploadImageResponseDTO> {
    try {
      const extension = mime.getExtension(blob.type) || 'jpg';
      const filename = `${uuidv4()}.${extension}`;
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('imageId', imageId);

      return firstValueFrom(this.http.post<UploadImageResponseDTO>('/api/files/image', formData));
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}
