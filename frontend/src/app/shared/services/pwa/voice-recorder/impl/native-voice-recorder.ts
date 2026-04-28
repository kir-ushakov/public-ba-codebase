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
}
