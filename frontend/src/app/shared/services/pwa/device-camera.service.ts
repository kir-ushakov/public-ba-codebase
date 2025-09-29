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
    
    try {
      const image = await Camera.getPhoto({
        quality,
        resultType: CameraResultType.Uri,
      });

      // Cancel: no image selected
      if (!image?.webPath) {
        return null;
      }

      const imageUrl = image.webPath;

      return imageUrl;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }
}
