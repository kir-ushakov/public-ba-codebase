export type SpeechToTextRequestDTO = {
  audio: Blob;
};

export type SpeechToTextResponseDTO = {
  transcript: string;
};
