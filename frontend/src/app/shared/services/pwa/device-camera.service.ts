import { Injectable } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';

@Injectable({
  providedIn: 'root',
})
export class DeviceCameraService {
  public async takePicture(quality = 90): Promise<string> {
    if (quality < 0 || quality > 100) {
      throw new Error('Quality must be between 0 and 100');
    }

    // TODO: handle case when user cancels the photo taking
    // Now it lead to throw error - that never handled upper
    // console.error('Error taking picture:', error);
    // But in fact it's not an error
    // TICKET: https://brainas.atlassian.net/browse/BA-244
    try {
      const image = await Camera.getPhoto({
        quality,
        resultType: CameraResultType.Uri,
      });

      if (!image.webPath) {
        throw new Error('No image URL available');
      }

      const imageUrl = image.webPath;

      return imageUrl;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }
}
