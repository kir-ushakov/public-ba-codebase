import { Injectable } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';

/**
 * #NOTE:
 * This is my service, which encapsulates the essential logic 
 * for capturing photos using device cameras. 
 * It is primarily built on the Capacitor API.
 */
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
        /**
         * #NOTE:
         * The quality parameter in the Capacitor Camera represents the native capture quality, 
         * with built-in compression (typically JPEG) optimized by the device manufacturer. 
         */
        quality,
        /**
         * #NOTE:
         * The resultType parameter determines the format in which the image data is returned, 
         * offering three possible values. The recommended option is CameraResultType.Uri, 
         * which returns an image URI. This format uses low memory, 
         * as the image is stored in a sandboxed file system (temporary storage) on the browser. \
         * On native mobile devices (iOS/Android), the image is stored in the app’s temporary 
         * directory or photo library. 
         * I suggest avoiding the other two types, as both keep images in RAM, 
         * which can negatively impact performance.
         */
        resultType: CameraResultType.Uri,
      });

      /**
       * #NOTE: 
       * The webPath property is expected when using CameraResultType.Uri, 
       * but it may be missing in certain cases. 
       * This can happen due to platform-specific limitations, 
       * permission issues, or unexpected plugin behavior. 
       * Checking for webPath ensures the code handles such cases gracefully, 
       * preventing errors when accessing the image URL.
       */
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
