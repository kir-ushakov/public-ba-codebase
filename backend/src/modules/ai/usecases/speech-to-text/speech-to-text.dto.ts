export interface SpeechToTextRequestDTO {
  audio: Blob;
}

export interface SpeechToTextResponseDTO {
  transcript: string;
}
