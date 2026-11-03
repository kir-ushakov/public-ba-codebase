import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UploadAudioContract } from '@brainassistant/contracts';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { AudioDbService } from '../infrastructure/audio-db.service';
import { UuidGeneratorService } from '../adapters/uuid-generator.service';

export type EnsureAudioUploadedResult = 'uploaded' | 'alreadyRemote' | 'missingBlob' | 'failed';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly uploadsInFlight = new Map<string, Promise<EnsureAudioUploadedResult>>();

  constructor(
    private readonly audioDb: AudioDbService,
    private readonly http: HttpClient,
    private readonly uuidGenerator: UuidGeneratorService,
  ) {}

  public async saveBlob(
    blob: Blob,
    durationMs: number,
  ): Promise<{
    id: string;
    durationMs: number;
    mimeType: string;
    createdAt: string;
  }> {
    const id = this.uuidGenerator.generate();
    await this.audioDb.putAudio(id, blob, false);
    return {
      id,
      durationMs,
      mimeType: blob.type || 'audio/webm',
      createdAt: new Date().toISOString(),
    };
  }

  public getRecord(id: string) {
    return this.audioDb.getAudio(id);
  }

  public deleteBlob(id: string): Promise<void> {
    return this.audioDb.deleteAudio(id);
  }

  public async objectUrl(id: string): Promise<string | null> {
    const record = await this.audioDb.getAudio(id);
    if (record?.blob) {
      return URL.createObjectURL(record.blob);
    }
    try {
      const blob = await firstValueFrom(
        this.http.get(`${API_ENDPOINTS.FILES.AUDIO}/${id}`, { responseType: 'blob' }),
      );
      await this.audioDb.putAudio(id, blob, true);
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  public ensureUploaded(audioId: string): Promise<EnsureAudioUploadedResult> {
    const inFlight = this.uploadsInFlight.get(audioId);
    if (inFlight) {
      return inFlight;
    }
    const upload = this.uploadIfNeeded(audioId).finally(() => {
      this.uploadsInFlight.delete(audioId);
    });
    this.uploadsInFlight.set(audioId, upload);
    return upload;
  }

  public deleteRemote(audioId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_ENDPOINTS.FILES.AUDIO}/${audioId}`)).then(
      () => undefined,
    );
  }

  private async uploadIfNeeded(audioId: string): Promise<EnsureAudioUploadedResult> {
    const record = await this.audioDb.getAudio(audioId);
    if (!record || record.uploaded) {
      return 'alreadyRemote';
    }
    if (!record.blob) {
      return 'missingBlob';
    }
    try {
      const extension = extensionForMime(record.blob.type);
      const request: UploadAudioContract.Request = { audioId, file: record.blob };
      const formData = new FormData();
      formData.append('file', request.file, `${audioId}.${extension}`);
      formData.append('audioId', request.audioId);
      await firstValueFrom(
        this.http.post<UploadAudioContract.Response>(API_ENDPOINTS.FILES.AUDIO, formData),
      );
      await this.audioDb.updateAudio(audioId, { uploaded: true });
      return 'uploaded';
    } catch (error) {
      console.error(`Failed to upload audio ${audioId}:`, error);
      return 'failed';
    }
  }
}

function extensionForMime(mimeType: string): string {
  const base = mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  const known: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
  };
  return known[base] ?? 'webm';
}
