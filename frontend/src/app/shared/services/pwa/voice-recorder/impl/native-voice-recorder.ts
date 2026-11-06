import { VoiceRecorder } from 'capacitor-voice-recorder';

import type { IVoiceRecorder } from '../voice-recorder.interface';
/*
 * #VIWAI_FE_NATIVE-VOICE-RECORDER:
 *
 * Native voice recorder: provides a native implementation of the voice recorder service.
 *
 * This implementation uses the Capacitor Voice Recorder plugin to record audio.
 */
export class NativeVoiceRecorder implements IVoiceRecorder {
  readonly engine = 'native' as const;

  async start(): Promise<void> {
    const device = await VoiceRecorder.canDeviceVoiceRecord();
    if (!device.value) {
      throw new Error('This device cannot record audio');
    }

    const perm = await VoiceRecorder.requestAudioRecordingPermission();
    if (!perm.value) {
      throw new Error('Microphone permission denied');
    }

    await VoiceRecorder.startRecording();
  }

  async stop(): Promise<Blob> {
    const result = await VoiceRecorder.stopRecording();
    const payload = result.value;
    if (!payload?.recordDataBase64) {
      throw new Error('No audio captured');
    }

    const binary = atob(payload.recordDataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const mimeType = payload.mimeType?.trim() || 'audio/mp4';
    const blob = new Blob([bytes], { type: mimeType });
    return blob;
  }

  cancel(): void {
    void VoiceRecorder.stopRecording();
  }

  /**
   * Real pause on the Capacitor plugin (`capacitor-voice-recorder` 6.0.3).
   * Android, iOS and the plugin web shim expose `pauseRecording`. Older OS
   * versions reject with `NOT_SUPPORTED_OS_VERSION`; that must surface as a failure.
   */
  async pause(): Promise<void> {
    const result = await VoiceRecorder.pauseRecording();
    if (!result.value) {
      throw new Error('Pause failed');
    }
  }

  async resume(): Promise<void> {
    const result = await VoiceRecorder.resumeRecording();
    if (!result.value) {
      throw new Error('Resume failed');
    }
  }

  capturedBytes(): number {
    return 0;
  }

  level(): number {
    return 0;
  }

  /** The Capacitor plugin does not expose microphone levels, so there is no meter. */
  levels(): number[] {
    return [];
  }
}
