import { create } from 'zustand';
import type { VideoAsset, VideoClip, TextOverlay, Transition, AudioTrack, EditorProject, ExportSettings } from '../types';

interface HistoryState {
  clips: VideoClip[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
}

interface EditorState {
  // Assets
  assets: VideoAsset[];
  addAsset: (asset: VideoAsset) => void;
  removeAsset: (id: string) => void;
  
  // Project
  project: EditorProject | null;
  createProject: (name: string) => void;
  updateProject: (updates: Partial<EditorProject>) => void;
  
  // Clips
  clips: VideoClip[];
  addClip: (clip: VideoClip) => void;
  updateClip: (id: string, updates: Partial<VideoClip>) => void;
  removeClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  moveClip: (id: string, newIndex: number) => void;
  
  // Text Overlays
  textOverlays: TextOverlay[];
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  
  // Transitions
  transitions: Transition[];
  addTransition: (transition: Transition) => void;
  removeTransition: (id: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;
  
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
  
  // Aspect Ratio
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  setAspectRatio: (ratio: '9:16' | '16:9' | '1:1' | '4:5') => void;
  
  // Undo/Redo
  history: HistoryState[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  // Markers
  markers: { id: string; time: number; label: string }[];
  addMarker: (time: number, label: string) => void;
  removeMarker: (id: string) => void;
  
  // Processing State
  isProcessing: boolean;
  processingMessage: string;
  setProcessing: (processing: boolean, message?: string) => void;
  
  // Reset
  resetEditor: () => void;
}

const defaultExportSettings: ExportSettings = {
  resolution: '1080p',
  fps: 30,
  format: 'mp4',
  quality: 'high',
};

export const useEditorStore = create<EditorState>((set, get) => ({
  assets: [],
  addAsset: (asset) => set((state) => {
    state.pushHistory();
    return { assets: [...state.assets, asset] };
  }),
  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id),
  })),
  
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
  addClip: (clip) => set((state) => {
    state.pushHistory();
    return { clips: [...state.clips, clip] };
  }),
  updateClip: (id, updates) => set((state) => {
    state.pushHistory();
    return {
      clips: state.clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)),
    };
  }),
  removeClip: (id) => set((state) => {
    state.pushHistory();
    return {
      clips: state.clips.filter((clip) => clip.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    };
  }),
  duplicateClip: (id) => set((state) => {
    const clip = state.clips.find((c) => c.id === id);
    if (!clip) return state;
    
    state.pushHistory();
    const newClip = {
      ...clip,
      id: Date.now().toString(),
      timelineStart: clip.timelineStart + clip.duration,
    };
    return { clips: [...state.clips, newClip] };
  }),
  moveClip: (id, newIndex) => set((state) => {
    state.pushHistory();
    const clips = [...state.clips];
    const currentIndex = clips.findIndex((c) => c.id === id);
    if (currentIndex === -1) return state;
    
    const [clip] = clips.splice(currentIndex, 1);
    clips.splice(newIndex, 0, clip);
    
    // Recalculate timeline positions
    let position = 0;
    clips.forEach((c) => {
      c.timelineStart = position;
      position += c.duration;
    });
    
    return { clips };
  }),
  
  textOverlays: [],
  addTextOverlay: (overlay) => set((state) => {
    state.pushHistory();
    return { textOverlays: [...state.textOverlays, overlay] };
  }),
  updateTextOverlay: (id, updates) => set((state) => {
    state.pushHistory();
    return {
      textOverlays: state.textOverlays.map((overlay) => (overlay.id === id ? { ...overlay, ...updates } : overlay)),
    };
  }),
  removeTextOverlay: (id) => set((state) => {
    state.pushHistory();
    return {
      textOverlays: state.textOverlays.filter((overlay) => overlay.id !== id),
      selectedOverlayId: state.selectedOverlayId === id ? null : state.selectedOverlayId,
    };
  }),
  
  transitions: [],
  addTransition: (transition) => set((state) => {
    state.pushHistory();
    return { transitions: [...state.transitions, transition] };
  }),
  removeTransition: (id) => set((state) => {
    state.pushHistory();
    return {
      transitions: state.transitions.filter((t) => t.id !== id),
    };
  }),
  updateTransition: (id, updates) => set((state) => {
    state.pushHistory();
    return {
      transitions: state.transitions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };
  }),
  
  audioTracks: [],
  addAudioTrack: (track) => set((state) => {
    state.pushHistory();
    return { audioTracks: [...state.audioTracks, track] };
  }),
  updateAudioTrack: (id, updates) => set((state) => {
    state.pushHistory();
    return {
      audioTracks: state.audioTracks.map((track) => (track.id === id ? { ...track, ...updates } : track)),
    };
  }),
  removeAudioTrack: (id) => set((state) => {
    state.pushHistory();
    return {
      audioTracks: state.audioTracks.filter((track) => track.id !== id),
    };
  }),
  
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
  
  aspectRatio: '16:9',
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  
  // Undo/Redo
  history: [],
  historyIndex: -1,
  pushHistory: () => set((state) => {
    const newHistoryState: HistoryState = {
      clips: [...state.clips],
      textOverlays: [...state.textOverlays],
      transitions: [...state.transitions],
    };
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newHistoryState);
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),
  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    
    const newIndex = state.historyIndex - 1;
    const historyState = state.history[newIndex];
    
    return {
      clips: historyState.clips,
      textOverlays: historyState.textOverlays,
      transitions: historyState.transitions,
      historyIndex: newIndex,
    };
  }),
  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    
    const newIndex = state.historyIndex + 1;
    const historyState = state.history[newIndex];
    
    return {
      clips: historyState.clips,
      textOverlays: historyState.textOverlays,
      transitions: historyState.transitions,
      historyIndex: newIndex,
    };
  }),
  
  // Markers
  markers: [],
  addMarker: (time, label) => set((state) => ({
    markers: [...state.markers, { id: Date.now().toString(), time, label }],
  })),
  removeMarker: (id) => set((state) => ({
    markers: state.markers.filter((m) => m.id !== id),
  })),
  
  // Processing
  isProcessing: false,
  processingMessage: '',
  setProcessing: (processing, message = '') => set({
    isProcessing: processing,
    processingMessage: message,
  }),
  
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
    aspectRatio: '16:9',
    history: [],
    historyIndex: -1,
    markers: [],
    isProcessing: false,
    processingMessage: '',
  }),
}));
