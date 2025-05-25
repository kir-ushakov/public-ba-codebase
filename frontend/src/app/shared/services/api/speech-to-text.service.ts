import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SpeechToTextResponse {
  transcript: string;
}

@Injectable({ providedIn: 'root' })
export class SpeechToTextService {
  private readonly VOICE_DECODE_API_ENDPOINT = `${environment.baseUrl}/ai/speech-to-text`;
  private readonly useFakeResponse = true; // toggle this to enable/disable fake response
  constructor(private http: HttpClient) {}

  uploadAudio(blob: Blob): Observable<{ transcript: string }> {
    if (this.useFakeResponse) {
      // Return fake transcript with some artificial delay to simulate network latency
      const fakeResponse = { transcript: 'This is a fake transcript for testing.' };
      return of(fakeResponse).pipe(delay(500)); // 500ms delay
    }

    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');

    return this.http.post<{ transcript: string }>(this.VOICE_DECODE_API_ENDPOINT, formData);
  }
}
