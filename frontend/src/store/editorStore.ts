import { create } from 'zustand';
import type { VideoAsset, VideoClip, TextOverlay, Transition, AudioTrack, EditorProject, ExportSettings } from '../types';

interface EditorState {
  // Assets
  assets: VideoAsset[];
  addAsset: (asset: VideoAsset) => void;
  
  // Project
  project: EditorProject | null;
  createProject: (name: string) => void;
  updateProject: (updates: Partial<EditorProject>) => void;
  
  // Clips
  clips: VideoClip[];
  addClip: (clip: VideoClip) => void;
  updateClip: (id: string, updates: Partial<VideoClip>) => void;
  removeClip: (id: string) => void;
  
  // Text Overlays
  textOverlays: TextOverlay[];
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  
  // Transitions
  transitions: Transition[];
  addTransition: (transition: Transition) => void;
  removeTransition: (id: string) => void;
  
  // Audio Tracks
  audioTracks: AudioTrack[];
  addAudioTrack: (track: AudioTrack) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (id: string) => void;
  
  // Playback
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  
  // Selection
  selectedClipId: string | null;
  selectedOverlayId: string | null;
  setSelectedClip: (id: string | null) => void;
  setSelectedOverlay: (id: string | null) => void;
  
  // Export
  exportSettings: ExportSettings;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
  
  // Zoom and View
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
  
  // Reset
  resetEditor: () => void;
}

const defaultExportSettings: ExportSettings = {
  resolution: '1080p',
  fps: 30,
  format: 'mp4',
  quality: 'high',
};

export const useEditorStore = create<EditorState>((set) => ({
  assets: [],
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  
  project: null,
  createProject: (name) => set({
    project: {
      id: Date.now().toString(),
      name,
      clips: [],
      textOverlays: [],
      transitions: [],
      audioTracks: [],
      totalDuration: 0,
      resolution: { width: 1920, height: 1080 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }),
  updateProject: (updates) => set((state) => ({
    project: state.project ? { ...state.project, ...updates, updatedAt: new Date().toISOString() } : null,
  })),
  
  clips: [],
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  updateClip: (id, updates) => set((state) => ({
    clips: state.clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)),
  })),
  removeClip: (id) => set((state) => ({
    clips: state.clips.filter((clip) => clip.id !== id),
    selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
  })),
  
  textOverlays: [],
  addTextOverlay: (overlay) => set((state) => ({ textOverlays: [...state.textOverlays, overlay] })),
  updateTextOverlay: (id, updates) => set((state) => ({
    textOverlays: state.textOverlays.map((overlay) => (overlay.id === id ? { ...overlay, ...updates } : overlay)),
  })),
  removeTextOverlay: (id) => set((state) => ({
    textOverlays: state.textOverlays.filter((overlay) => overlay.id !== id),
    selectedOverlayId: state.selectedOverlayId === id ? null : state.selectedOverlayId,
  })),
  
  transitions: [],
  addTransition: (transition) => set((state) => ({ transitions: [...state.transitions, transition] })),
  removeTransition: (id) => set((state) => ({
    transitions: state.transitions.filter((t) => t.id !== id),
  })),
  
  audioTracks: [],
  addAudioTrack: (track) => set((state) => ({ audioTracks: [...state.audioTracks, track] })),
  updateAudioTrack: (id, updates) => set((state) => ({
    audioTracks: state.audioTracks.map((track) => (track.id === id ? { ...track, ...updates } : track)),
  })),
  removeAudioTrack: (id) => set((state) => ({
    audioTracks: state.audioTracks.filter((track) => track.id !== id),
  })),
  
  currentTime: 0,
  isPlaying: false,
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  selectedClipId: null,
  selectedOverlayId: null,
  setSelectedClip: (id) => set({ selectedClipId: id, selectedOverlayId: null }),
  setSelectedOverlay: (id) => set({ selectedOverlayId: id, selectedClipId: null }),
  
  exportSettings: defaultExportSettings,
  setExportSettings: (settings) => set((state) => ({
    exportSettings: { ...state.exportSettings, ...settings },
  })),
  
  timelineZoom: 1,
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(zoom, 4)) }),
  
  resetEditor: () => set({
    assets: [],
    project: null,
    clips: [],
    textOverlays: [],
    transitions: [],
    audioTracks: [],
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null,
    selectedOverlayId: null,
    exportSettings: defaultExportSettings,
    timelineZoom: 1,
  }),
}));
