import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, Modal } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../src/store/editorStore';
import Timeline from '../src/components/Timeline';
import TextOverlayEditor from '../src/components/TextOverlayEditor';
import StickerPanel from '../src/components/StickerPanel';
import { SPEED_PRESETS, TRANSITIONS, FILTERS } from '../src/utils/constants';
import type { VideoClip, FilterEffect } from '../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_PREVIEW_HEIGHT = 300;

type TabType = 'edit' | 'filters' | 'text' | 'stickers' | 'speed' | 'transitions' | 'audio' | 'export';

export default function EditorScreen() {
  const videoRef = useRef<Video>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('edit');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  
  const {
    assets,
    clips,
    addClip,
    updateClip,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    selectedClipId,
    textOverlays,
  } = useEditorStore();

  const currentAsset = assets[0];
  const currentClip = clips.find(c => c.id === selectedClipId);

  useEffect(() => {
    if (currentAsset && clips.length === 0) {
      const initialClip: VideoClip = {
        id: Date.now().toString(),
        assetId: currentAsset.id,
        startTime: 0,
        endTime: currentAsset.duration / 1000,
        duration: currentAsset.duration / 1000,
        timelineStart: 0,
        filters: [],
        speed: 1,
        volume: 1,
      };
      addClip(initialClip);
      setTrimEnd(currentAsset.duration / 1000);
      setDuration(currentAsset.duration / 1000);
    }
  }, [currentAsset, clips.length]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
    }
  };

  const togglePlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = async (time: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(time * 1000);
      setCurrentTime(time);
    }
  };

  const applyTrim = () => {
    if (currentClip && currentAsset) {
      updateClip(currentClip.id, {
        startTime: trimStart,
        endTime: trimEnd,
        duration: trimEnd - trimStart,
      });
      Alert.alert('Success', `Video trimmed to ${formatTime(trimEnd - trimStart)}`);
    }
  };

  const addFilter = (filterType: FilterEffect['type'], intensity: number = 0.5) => {
    if (currentClip) {
      const newFilter: FilterEffect = { type: filterType, intensity };
      const existingFilters = currentClip.filters.filter(f => f.type !== filterType);
      updateClip(currentClip.id, {
        filters: [...existingFilters, newFilter],
      });
      Alert.alert('Success', `${filterType} filter applied!`);
    }
  };

  const applySpeed = (speed: number) => {
    if (currentClip) {
      updateClip(currentClip.id, { speed });
      setSelectedSpeed(speed);
      Alert.alert('Success', `Speed changed to ${speed}x`);
    }
  };

  const handleStickerSelect = (sticker: string) => {
    Alert.alert('Sticker Selected', `You selected: ${sticker}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentAsset) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No video loaded</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editor</Text>
        <TouchableOpacity onPress={() => setCurrentTab('export')} style={styles.headerButton}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Video Preview */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: currentAsset.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        
        {/* Text Overlays Preview */}
        {textOverlays.map((overlay) => {
          if (currentTime >= overlay.timelineStart && currentTime <= overlay.timelineStart + overlay.duration) {
            return (
              <View
                key={overlay.id}
                style={[
                  styles.overlayPreview,
                  {
                    top: `${overlay.position.y * 100}%`,
                    left: `${overlay.position.x * 100}%`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: overlay.fontSize / 2,
                    color: overlay.color,
                    fontWeight: overlay.fontWeight,
                    backgroundColor: overlay.backgroundColor,
                  }}
                >
                  {overlay.text}
                </Text>
              </View>
            );
          }
          return null;
        })}
        
        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.timelineSlider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={seekTo}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#444"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Timeline */}
      <Timeline />

      {/* Main Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mainTabContainer}>
        {[
          { id: 'edit', label: 'Edit', icon: 'cut-outline' },
          { id: 'filters', label: 'Filters', icon: 'color-filter-outline' },
          { id: 'text', label: 'Text', icon: 'text-outline' },
          { id: 'stickers', label: 'Stickers', icon: 'happy-outline' },
          { id: 'speed', label: 'Speed', icon: 'speedometer-outline' },
          { id: 'transitions', label: 'Transitions', icon: 'git-merge-outline' },
          { id: 'audio', label: 'Audio', icon: 'musical-notes-outline' },
          { id: 'export', label: 'Export', icon: 'download-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.mainTab, currentTab === tab.id && styles.activeMainTab]}
            onPress={() => setCurrentTab(tab.id as TabType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={currentTab === tab.id ? '#007AFF' : '#888'}
            />
            <Text style={[styles.mainTabText, currentTab === tab.id && styles.activeMainTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer}>
        {currentTab === 'edit' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Trim & Split</Text>
            <View style={styles.trimControls}>
              <View style={styles.trimControl}>
                <Text style={styles.label}>Start: {formatTime(trimStart)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={trimStart}
                  onValueChange={setTrimStart}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#007AFF"
                />
              </View>
              <View style={styles.trimControl}>
                <Text style={styles.label}>End: {formatTime(trimEnd)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={trimStart}
                  maximumValue={duration}
                  value={trimEnd}
                  onValueChange={setTrimEnd}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#007AFF"
                />
              </View>
              <Text style={styles.info}>Duration: {formatTime(trimEnd - trimStart)}</Text>
              <TouchableOpacity style={styles.applyButton} onPress={applyTrim}>
                <Text style={styles.applyButtonText}>Apply Trim</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'filters' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Filters & Effects</Text>
            <View style={styles.filterGrid}>
              {Object.entries(FILTERS).map(([key, filter]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.filterButton}
                  onPress={() => addFilter(key as FilterEffect['type'], filter.defaultIntensity)}
                >
                  <Ionicons name={filter.icon as any} size={32} color="#007AFF" />
                  <Text style={styles.filterText}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {currentClip && currentClip.filters.length > 0 && (
              <View style={styles.activeFilters}>
                <Text style={styles.label}>Active:</Text>
                {currentClip.filters.map((filter, index) => (
                  <View key={index} style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {filter.type} ({Math.round(filter.intensity * 100)}%)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentTab === 'text' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Text Overlays</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowTextEditor(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Text</Text>
            </TouchableOpacity>
            {textOverlays.length > 0 && (
              <View style={styles.overlaysList}>
                {textOverlays.map((overlay) => (
                  <View key={overlay.id} style={styles.overlayItem}>
                    <Text style={styles.overlayText}>{overlay.text}</Text>
                    <Text style={styles.overlayTime}>
                      {formatTime(overlay.timelineStart)} - {formatTime(overlay.timelineStart + overlay.duration)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentTab === 'stickers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Stickers</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowStickerPanel(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Sticker</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentTab === 'speed' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Speed Control</Text>
            <View style={styles.speedGrid}>
              {SPEED_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.speedButton,
                    selectedSpeed === preset.value && styles.selectedSpeedButton,
                  ]}
                  onPress={() => applySpeed(preset.value)}
                >
                  <Ionicons
                    name={preset.icon as any}
                    size={24}
                    color={selectedSpeed === preset.value ? '#007AFF' : '#fff'}
                  />
                  <Text
                    style={[
                      styles.speedText,
                      selectedSpeed === preset.value && styles.selectedSpeedText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentTab === 'transitions' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Transitions</Text>
            <View style={styles.transitionGrid}>
              {Object.entries(TRANSITIONS).map(([key, transition]) => (
                <TouchableOpacity key={key} style={styles.transitionButton}>
                  <Ionicons name={transition.icon as any} size={32} color="#007AFF" />
                  <Text style={styles.transitionText}>{transition.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentTab === 'audio' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Audio</Text>
            <Text style={styles.label}>Volume</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={currentClip?.volume || 1}
              onValueChange={(value) => currentClip && updateClip(currentClip.id, { volume: value })}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#444"
              thumbTintColor="#007AFF"
            />
            <Text style={styles.info}>Volume: {Math.round((currentClip?.volume || 1) * 100)}%</Text>
          </View>
        )}

        {currentTab === 'export' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Export Video</Text>
            <View style={styles.exportOptions}>
              {['480p', '720p', '1080p', '4K'].map((res) => (
                <TouchableOpacity key={res} style={styles.exportButton}>
                  <Text style={styles.exportButtonText}>Export {res}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.comingSoon}>Backend integration in progress</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <TextOverlayEditor visible={showTextEditor} onClose={() => setShowTextEditor(false)} />
      <StickerPanel
        visible={showStickerPanel}
        onClose={() => setShowStickerPanel(false)}
        onSelect={handleStickerSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#1C1C1E',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoContainer: {
    height: VIDEO_PREVIEW_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  overlayPreview: {
    position: 'absolute',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
  },
  playButton: {
    marginRight: 12,
  },
  timelineSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
  },
  mainTabContainer: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    maxHeight: 60,
  },
  mainTab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  mainTabText: {
    fontSize: 11,
    color: '#888',
  },
  activeMainTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  trimControls: {
    gap: 16,
  },
  trimControl: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterButton: {
    width: (SCREEN_WIDTH - 56) / 3,
    aspectRatio: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
  },
  activeFilters: {
    marginTop: 24,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlaysList: {
    marginTop: 16,
    gap: 12,
  },
  overlayItem: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overlayTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedButton: {
    width: (SCREEN_WIDTH - 56) / 4,
    aspectRatio: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectedSpeedButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF22',
  },
  speedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedSpeedText: {
    color: '#007AFF',
  },
  transitionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  transitionButton: {
    width: (SCREEN_WIDTH - 56) / 3,
    aspectRatio: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  transitionText: {
    color: '#fff',
    fontSize: 12,
  },
  exportOptions: {
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  exportButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoon: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
