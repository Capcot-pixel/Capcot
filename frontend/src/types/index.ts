// Video Editor Types

export interface VideoAsset {
  id: string;
  uri: string;
  duration: number;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  thumbnail?: string;
}

export interface VideoClip {
  id: string;
  assetId: string;
  startTime: number; // Start time in the asset
  endTime: number; // End time in the asset
  duration: number; // Clip duration
  timelineStart: number; // Position in timeline
  filters: FilterEffect[];
  speed: number; // Speed multiplier (0.5 = half speed, 2 = double speed)
  volume: number; // 0 to 1
}

export interface TextOverlay {
  id: string;
  text: string;
  timelineStart: number;
  duration: number;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right';
}

export interface FilterEffect {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale' | 'sepia';
  intensity: number; // 0 to 1
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number; // in seconds
  position: number; // Timeline position
}

export interface AudioTrack {
  id: string;
  uri: string;
  timelineStart: number;
  duration: number;
  volume: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export interface EditorProject {
  id: string;
  name: string;
  clips: VideoClip[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
  audioTracks: AudioTrack[];
  totalDuration: number;
  resolution: { width: number; height: number };
  createdAt: string;
  updatedAt: string;
}

export interface ExportSettings {
  resolution: '480p' | '720p' | '1080p' | '4K';
  fps: 24 | 30 | 60;
  format: 'mp4' | 'mov';
  quality: 'low' | 'medium' | 'high';
}
