export interface SpeechToTextRequestDTO {
  file: Blob;
}

export interface SpeechToTextResponseDTO {
  transcript: string;
}
