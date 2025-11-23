

export enum ViewType {
  FRONT = 'Full Body Frontal',
  SIDE = 'Side Profile / 45 Degree',
  CLOSEUP = 'Detailed Upper Body',
  LIFESTYLE = 'Candid Lifestyle Shot'
}

export type Language = 'en' | 'es' | 'pt';

export type ImageQuality = 'standard' | 'high' | 'ultra';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  viewType: ViewType;
  timestamp: number;
  expertOpinion?: string; // Mía's feedback
  videoUrl?: string; // URL for the generated Veo video
  isVideoGenerating?: boolean; // Loading state for video
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 100
  error: string | null;
}

export interface ImageInputState {
  file: File | null;
  previewUrl: string | null;
  description: string;
  height?: string;
  weight?: string;
}

export interface GarmentState {
  id: string;
  file: File | null;
  previewUrl: string | null;
  description: string;
}

export interface AppState {
  person: ImageInputState;
  garments: GarmentState[];
  selectedViews: ViewType[];
  quality: ImageQuality;
  customPrompt: string;
}