import { Injectable } from '@angular/core';
import { IDeviceCameraService } from '../../src/app/shared/services/pwa/device-camera.service.interface';

/**
 * Stub DeviceCameraService for E2E testing
 * Returns a fake image from e2e/assets instead of using the device camera
 * Implements IDeviceCameraService to ensure API compatibility
 */
@Injectable({
  providedIn: 'root',
})
export class DeviceCameraService implements IDeviceCameraService {
  // Path to the test image in e2e/assets
  private readonly TEST_IMAGE_PATH = 'e2e/assets/test-img.jpg';

  public async takePicture(quality = 90): Promise<string | null> {
    console.log('[E2E] DeviceCameraService.takePicture() called - returning test image');
    
    // Simulate a small delay like a real camera would have
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fetch the test image and convert it to a blob URL
    const response = await fetch(this.TEST_IMAGE_PATH);
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    console.log('[E2E] Test image loaded successfully:', imageUrl);
    return imageUrl;
  }
}

