// Filter and Effect Constants

export const FILTERS = {
  brightness: {
    name: 'Brightness',
    icon: 'sunny-outline',
    defaultIntensity: 0.6,
  },
  contrast: {
    name: 'Contrast',
    icon: 'contrast-outline',
    defaultIntensity: 0.6,
  },
  saturation: {
    name: 'Saturation',
    icon: 'color-palette-outline',
    defaultIntensity: 0.6,
  },
  blur: {
    name: 'Blur',
    icon: 'ellipse-outline',
    defaultIntensity: 0.3,
  },
  grayscale: {
    name: 'Grayscale',
    icon: 'images-outline',
    defaultIntensity: 1.0,
  },
  sepia: {
    name: 'Sepia',
    icon: 'cafe-outline',
    defaultIntensity: 0.8,
  },
  vignette: {
    name: 'Vignette',
    icon: 'radio-button-off-outline',
    defaultIntensity: 0.5,
  },
  vintage: {
    name: 'Vintage',
    icon: 'camera-outline',
    defaultIntensity: 0.7,
  },
  warm: {
    name: 'Warm',
    icon: 'flame-outline',
    defaultIntensity: 0.5,
  },
  cool: {
    name: 'Cool',
    icon: 'snow-outline',
    defaultIntensity: 0.5,
  },
};

export const TRANSITIONS = {
  fade: {
    name: 'Fade',
    icon: 'contrast-outline',
    defaultDuration: 0.5,
  },
  dissolve: {
    name: 'Dissolve',
    icon: 'water-outline',
    defaultDuration: 0.5,
  },
  wipe: {
    name: 'Wipe',
    icon: 'arrow-forward-outline',
    defaultDuration: 0.7,
  },
  slide: {
    name: 'Slide',
    icon: 'swap-horizontal-outline',
    defaultDuration: 0.7,
  },
  zoom: {
    name: 'Zoom',
    icon: 'expand-outline',
    defaultDuration: 0.5,
  },
  blur_transition: {
    name: 'Blur',
    icon: 'ellipse-outline',
    defaultDuration: 0.5,
  },
};

export const SPEED_PRESETS = [
  { label: '0.25x', value: 0.25, icon: 'play-back-outline' },
  { label: '0.5x', value: 0.5, icon: 'play-skip-back-outline' },
  { label: '0.75x', value: 0.75, icon: 'rewind-outline' },
  { label: '1x', value: 1, icon: 'play-outline' },
  { label: '1.25x', value: 1.25, icon: 'fast-forward-outline' },
  { label: '1.5x', value: 1.5, icon: 'play-skip-forward-outline' },
  { label: '2x', value: 2, icon: 'play-forward-outline' },
  { label: '3x', value: 3, icon: 'flash-outline' },
];

export const TEXT_ANIMATIONS = {
  none: { name: 'None', icon: 'text-outline' },
  fadeIn: { name: 'Fade In', icon: 'arrow-up-outline' },
  fadeOut: { name: 'Fade Out', icon: 'arrow-down-outline' },
  slideLeft: { name: 'Slide Left', icon: 'arrow-back-outline' },
  slideRight: { name: 'Slide Right', icon: 'arrow-forward-outline' },
  slideUp: { name: 'Slide Up', icon: 'arrow-up-outline' },
  slideDown: { name: 'Slide Down', icon: 'arrow-down-outline' },
  bounce: { name: 'Bounce', icon: 'basketball-outline' },
  typewriter: { name: 'Typewriter', icon: 'create-outline' },
  glitch: { name: 'Glitch', icon: 'flash-outline' },
};

export const TEXT_STYLES = [
  { id: 'basic', name: 'Basic', fontSize: 32, color: '#FFFFFF', backgroundColor: 'transparent' },
  { id: 'bold', name: 'Bold', fontSize: 36, color: '#FFFFFF', backgroundColor: 'transparent', fontWeight: 'bold' },
  { id: 'neon', name: 'Neon', fontSize: 34, color: '#00FF00', backgroundColor: '#000000' },
  { id: 'pop', name: 'Pop', fontSize: 40, color: '#FF00FF', backgroundColor: '#FFFF00' },
  { id: 'subtitle', name: 'Subtitle', fontSize: 28, color: '#FFFFFF', backgroundColor: '#00000088' },
  { id: 'cinematic', name: 'Cinematic', fontSize: 30, color: '#FFD700', backgroundColor: 'transparent' },
];

export const STICKER_CATEGORIES = {
  emoji: {
    name: 'Emoji',
    icon: 'happy-outline',
    stickers: ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '👍', '👋', '🎉', '❤️', '🔥', '⭐', '✨', '🎵', '🎬'],
  },
  shapes: {
    name: 'Shapes',
    icon: 'square-outline',
    stickers: ['⬜', '⬛', '🟥', '🟦', '🟩', '🟨', '🟧', '🟪', '⭐', '❤️', '💛', '💚', '💙', '💜'],
  },
  arrows: {
    name: 'Arrows',
    icon: 'arrow-forward-outline',
    stickers: ['⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '🔄', '🔃', '⤴️', '⤵️'],
  },
  symbols: {
    name: 'Symbols',
    icon: 'sparkles-outline',
    stickers: ['✓', '✗', '⚠️', '‼️', '⁉️', '💯', '🔔', '🎯', '💡', '🔑', '🎁', '🏆', '👑', '💎'],
  },
};

export const AUDIO_EFFECTS = {
  fadeIn: { name: 'Fade In', icon: 'trending-up-outline', duration: 1 },
  fadeOut: { name: 'Fade Out', icon: 'trending-down-outline', duration: 1 },
  echo: { name: 'Echo', icon: 'repeat-outline', intensity: 0.5 },
  reverb: { name: 'Reverb', icon: 'radio-outline', intensity: 0.5 },
  bassBoost: { name: 'Bass Boost', icon: 'musical-notes-outline', intensity: 0.5 },
};

export const EXPORT_QUALITIES = {
  '480p': { width: 854, height: 480, bitrate: '1000k' },
  '720p': { width: 1280, height: 720, bitrate: '2500k' },
  '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
  '4K': { width: 3840, height: 2160, bitrate: '15000k' },
};

export const VIDEO_FORMATS = [
  { value: 'mp4', label: 'MP4', icon: 'videocam-outline' },
  { value: 'mov', label: 'MOV', icon: 'film-outline' },
];

export const FPS_OPTIONS = [24, 30, 60];

export const TIMELINE_ZOOM_LEVELS = [0.5, 1, 1.5, 2, 3, 4];
