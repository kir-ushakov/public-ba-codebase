import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SpeechToTextResponse {
  transcript: string;
}

@Injectable({ providedIn: 'root' })
export class SpeechToTextService {
  private readonly VOICE_DECODE_API_ENDPOINT = `${environment.baseUrl}/ai/speech-to-text`;
  constructor(private http: HttpClient) {}

  uploadAudio(blob: Blob): Observable<{ transcript: string }> {
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');

    return this.http.post<{ transcript: string }>(this.VOICE_DECODE_API_ENDPOINT, formData);
  }
}
