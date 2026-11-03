import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SpeechToTextResponse {
  transcript: string;
}

/**
 * #VIWAI_FE_SPEECH-TO-TEXT-SERVICE:
 *
 * Speech to text service: provides a service for transcribing audio to text.
 *
 * This service uses the OpenAI API to transcribe audio to text.
 */
@Injectable({ providedIn: 'root' })
export class SpeechToTextService {
  private readonly VOICE_DECODE_API_ENDPOINT = `${environment.baseUrl}ai/speech-to-text`;
  constructor(private http: HttpClient) {}

  uploadAudio(blob: Blob): Observable<{ transcript: string }> {
    const formData = new FormData();
    formData.append('file', blob, `voice.${extensionForMime(blob.type)}`);

    return this.http.post<{ transcript: string }>(this.VOICE_DECODE_API_ENDPOINT, formData);
  }
}

function extensionForMime(mimeType: string): string {
  const base = mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  const known: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mpga': 'mpga',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  return known[base] ?? 'webm';
}
