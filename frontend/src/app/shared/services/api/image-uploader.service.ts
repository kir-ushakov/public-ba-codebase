import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';
import { ImageUploadContract } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';

@Injectable({
  providedIn: 'root',
})
export class ImageUploaderService {
  constructor(private http: HttpClient) {}

  public async uploadImageBlob(imageId: string, blob: Blob): Promise<ImageUploadContract.Response> {
    try {
      const extension = mime.getExtension(blob.type) || 'jpg';
      const filename = `${uuidv4()}.${extension}`;
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('imageId', imageId);

      const response = await firstValueFrom(
        this.http.post<ImageUploadContract.Response>(API_ENDPOINTS.FILES.IMAGE, formData),
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}
