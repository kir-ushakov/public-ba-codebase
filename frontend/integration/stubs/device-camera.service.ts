import { Injectable } from '@angular/core';
import { IDeviceCameraService } from '../../src/app/shared/services/pwa/device-camera.service.interface';

/**
 * Stub DeviceCameraService for Playwright integration tests.
 * Returns a fake image from integration/assets instead of using the device camera.
 * Implements IDeviceCameraService to ensure API compatibility.
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceCameraService implements IDeviceCameraService {
  private readonly TEST_IMAGE_PATH = 'integration/assets/test-img.jpg';

  public async takePicture(quality = 90): Promise<string | null> {
    console.log('[integration] DeviceCameraService.takePicture() called - returning test image');

    await new Promise(resolve => setTimeout(resolve, 100));

    const response = await fetch(this.TEST_IMAGE_PATH);
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    console.log('[integration] Test image loaded successfully:', imageUrl);
    return imageUrl;
  }
}
