/**
 * Interface for DeviceCameraService
 * Both the real service and E2E stub must implement this interface
 */
export interface IDeviceCameraService {
  takePicture(quality?: number): Promise<string | null>;
}

