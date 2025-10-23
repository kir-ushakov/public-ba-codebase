import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime';
import { firstValueFrom } from 'rxjs';
import { UploadImageContract } from '@brainassistant/contracts';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';

@Injectable({
  providedIn: 'root',
})
export class ImageUploaderService {
  constructor(private http: HttpClient) {}

  public async uploadImageBlob(imageId: string, blob: Blob): Promise<UploadImageContract.Response> {
    try {
      const extension = mime.getExtension(blob.type) || 'jpg';
      const filename = `${uuidv4()}.${extension}`;
      
      // Build request according to UploadImageContract.Request
      const request: UploadImageContract.Request = {
        imageId,
        file: blob,
      };
      
      return await firstValueFrom(
        this.http.post<UploadImageContract.Response>(API_ENDPOINTS.FILES.IMAGE, this.mapRequestToFormData(request, filename)),
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Converts UploadImageContract.Request to FormData
   * Maps contract fields to multipart/form-data format
   */
  private mapRequestToFormData(request: UploadImageContract.Request, filename: string): FormData {
    const formData = new FormData();
    formData.append('file', request.file, filename);
    formData.append('imageId', request.imageId);
    return formData;
  }
}
