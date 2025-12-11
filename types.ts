export interface ReelItem {
  id: string;
  topic: string;
  subtopic: string;
  shortNote: string; // The text displayed on screen
  narrationScript: string; // The text spoken by TTS
  visualPrompt: string; // Prompt for image generation
}

export enum LoadingState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  GENERATING_MEDIA = 'GENERATING_MEDIA',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface GeneratedMedia {
  imageUrl?: string;
  audioUrl?: string;
}
