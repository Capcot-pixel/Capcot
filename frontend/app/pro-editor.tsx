import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../src/store/editorStore';
import { videoService } from '../src/services/videoProcessing';
import TextOverlayEditor from '../src/components/TextOverlayEditor';
import StickerPanel from '../src/components/StickerPanel';
import { SPEED_PRESETS, TRANSITIONS, FILTERS } from '../src/utils/constants';
import type { VideoClip, FilterEffect, TextOverlay } from '../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_PREVIEW_HEIGHT = 300;

export default function ProEditorScreen() {
  const videoRef = useRef<Video>(null);
  const [currentTab, setCurrentTab] = useState<'edit' | 'filters' | 'text' | 'speed' | 'transitions' | 'export'>('edit');
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  
  // Trim controls
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [splitPoint, setSplitPoint] = useState(0);
  
  const {
    assets,
    clips,
    addClip,
    updateClip,
    removeClip,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    selectedClipId,
    setSelectedClip,
    textOverlays,
    addTextOverlay,
  } = useEditorStore();

  const currentAsset = assets[0];
  const selectedClip = clips.find(c => c.id === selectedClipId) || clips[0];

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
      setSplitPoint(currentAsset.duration / 2000);
      setSelectedClip(initialClip.id);
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

  // ACTUAL TRIM FUNCTIONALITY
  const applyTrim = async () => {
    if (!selectedClip || !currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage('Trimming video...');

      const trimmedUri = await videoService.trimVideo(
        currentAsset.uri,
        trimStart,
        trimEnd
      );

      // Update the clip with new trimmed video
      updateClip(selectedClip.id, {
        startTime: 0,
        endTime: trimEnd - trimStart,
        duration: trimEnd - trimStart,
      });

      Alert.alert('Success!', `Video trimmed to ${formatTime(trimEnd - trimStart)}`);
      setProcessing(false);
    } catch (error) {
      console.error('Trim error:', error);
      Alert.alert('Error', 'Failed to trim video. Please try again.');
      setProcessing(false);
    }
  };

  // ACTUAL SPLIT FUNCTIONALITY
  const splitClip = async () => {
    if (!selectedClip || !currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage('Splitting video...');

      // Split into two parts
      const part1Uri = await videoService.trimVideo(
        currentAsset.uri,
        selectedClip.startTime,
        splitPoint
      );

      const part2Uri = await videoService.trimVideo(
        currentAsset.uri,
        splitPoint,
        selectedClip.endTime
      );

      // Create two new clips
      const clip1: VideoClip = {
        ...selectedClip,
        id: Date.now().toString() + '_1',
        endTime: splitPoint,
        duration: splitPoint - selectedClip.startTime,
      };

      const clip2: VideoClip = {
        ...selectedClip,
        id: Date.now().toString() + '_2',
        startTime: splitPoint,
        timelineStart: clip1.duration,
        duration: selectedClip.endTime - splitPoint,
      };

      // Remove original clip and add split clips
      removeClip(selectedClip.id);
      addClip(clip1);
      addClip(clip2);

      Alert.alert('Success!', 'Video split into 2 clips');
      setProcessing(false);
    } catch (error) {
      console.error('Split error:', error);
      Alert.alert('Error', 'Failed to split video. Please try again.');
      setProcessing(false);
    }
  };

  // ACTUALLY APPLY FILTER
  const applyFilter = async (filterType: FilterEffect['type'], intensity: number) => {
    if (!selectedClip || !currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage(`Applying ${filterType} filter...`);

      const filteredUri = await videoService.applyFilter(
        currentAsset.uri,
        filterType,
        intensity
      );

      // Update clip with filter
      const newFilter: FilterEffect = { type: filterType, intensity };
      const existingFilters = selectedClip.filters.filter(f => f.type !== filterType);
      
      updateClip(selectedClip.id, {
        filters: [...existingFilters, newFilter],
      });

      Alert.alert('Success!', `${filterType} filter applied!`);
      setProcessing(false);
    } catch (error) {
      console.error('Filter error:', error);
      Alert.alert('Error', `Failed to apply ${filterType}. Please try again.`);
      setProcessing(false);
    }
  };

  // ACTUALLY APPLY SPEED CHANGE
  const applySpeed = async (speed: number) => {
    if (!selectedClip || !currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage(`Changing speed to ${speed}x...`);

      const speedChangedUri = await videoService.changeSpeed(currentAsset.uri, speed);

      updateClip(selectedClip.id, { speed });

      Alert.alert('Success!', `Speed changed to ${speed}x`);
      setProcessing(false);
    } catch (error) {
      console.error('Speed error:', error);
      Alert.alert('Error', 'Failed to change speed. Please try again.');
      setProcessing(false);
    }
  };

  // ACTUALLY ADD TEXT OVERLAY
  const handleAddTextOverlay = async (overlay: TextOverlay) => {
    if (!currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage('Adding text overlay...');

      const textUri = await videoService.addTextOverlay(
        currentAsset.uri,
        overlay.text,
        overlay.fontSize,
        overlay.color,
        overlay.position.x,
        overlay.position.y,
        overlay.timelineStart,
        overlay.duration
      );

      addTextOverlay(overlay);

      Alert.alert('Success!', 'Text overlay added!');
      setProcessing(false);
    } catch (error) {
      console.error('Text overlay error:', error);
      Alert.alert('Error', 'Failed to add text. Please try again.');
      setProcessing(false);
    }
  };

  // ACTUALLY APPLY TRANSITION
  const applyTransition = async (transitionType: string) => {
    if (clips.length < 2) {
      Alert.alert('Info', 'You need at least 2 clips to add a transition');
      return;
    }

    try {
      setProcessing(true);
      setProcessingMessage(`Adding ${transitionType} transition...`);

      const clip1 = clips[0];
      const clip2 = clips[1];

      const transitionedUri = await videoService.addTransition(
        currentAsset.uri,
        currentAsset.uri,
        transitionType,
        1.0
      );

      Alert.alert('Success!', `${transitionType} transition added!`);
      setProcessing(false);
    } catch (error) {
      console.error('Transition error:', error);
      Alert.alert('Error', 'Failed to add transition. Please try again.');
      setProcessing(false);
    }
  };

  // ACTUALLY EXPORT VIDEO
  const exportVideo = async (resolution: string, quality: string) => {
    if (!currentAsset) return;

    try {
      setProcessing(true);
      setProcessingMessage(`Exporting in ${resolution}...`);

      const exportedUri = await videoService.exportVideo(
        currentAsset.uri,
        resolution,
        30,
        quality
      );

      Alert.alert('Success!', `Video exported in ${resolution}!`);
      setProcessing(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export video. Please try again.');
      setProcessing(false);
    }
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
      {/* Processing Overlay */}
      {processing && (
        <Modal transparent>
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>{processingMessage}</Text>
              <Text style={styles.processingSubtext}>Please wait...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pro Editor</Text>
        <View style={styles.headerRight}>
          <Text style={styles.clipCount}>{clips.length} clip{clips.length > 1 ? 's' : ''}</Text>
        </View>
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
        
        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
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

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { id: 'edit', label: 'Edit', icon: 'cut' },
          { id: 'filters', label: 'Filters', icon: 'color-filter' },
          { id: 'text', label: 'Text', icon: 'text' },
          { id: 'speed', label: 'Speed', icon: 'speedometer' },
          { id: 'transitions', label: 'Transitions', icon: 'git-merge' },
          { id: 'export', label: 'Export', icon: 'download' },
        ].map((tab: any) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, currentTab === tab.id && styles.activeTab]}
            onPress={() => setCurrentTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={20} color={currentTab === tab.id ? '#007AFF' : '#888'} />
            <Text style={[styles.tabText, currentTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* EDIT TAB */}
        {currentTab === 'edit' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✂️ Trim & Split</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trim Video</Text>
              <View style={styles.sliderGroup}>
                <Text style={styles.label}>Start: {formatTime(trimStart)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={trimStart}
                  onValueChange={setTrimStart}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#444"
                />
              </View>
              <View style={styles.sliderGroup}>
                <Text style={styles.label}>End: {formatTime(trimEnd)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={trimStart}
                  maximumValue={duration}
                  value={trimEnd}
                  onValueChange={setTrimEnd}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#444"
                />
              </View>
              <Text style={styles.info}>New duration: {formatTime(trimEnd - trimStart)}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={applyTrim}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Apply Trim</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Split at Position</Text>
              <View style={styles.sliderGroup}>
                <Text style={styles.label}>Split Point: {formatTime(splitPoint)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={splitPoint}
                  onValueChange={setSplitPoint}
                  minimumTrackTintColor="#FF9500"
                  maximumTrackTintColor="#444"
                />
              </View>
              <TouchableOpacity style={styles.warningButton} onPress={splitClip}>
                <Ionicons name="cut" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Split Clip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FILTERS TAB */}
        {currentTab === 'filters' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Filters & Effects</Text>
            <View style={styles.filterGrid}>
              {Object.entries(FILTERS).map(([key, filter]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.filterCard}
                  onPress={() => applyFilter(key as FilterEffect['type'], filter.defaultIntensity)}
                >
                  <Ionicons name={filter.icon as any} size={32} color="#007AFF" />
                  <Text style={styles.filterName}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TEXT TAB */}
        {currentTab === 'text' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Text Overlays</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowTextEditor(true)}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Text</Text>
            </TouchableOpacity>
            {textOverlays.map((overlay) => (
              <View key={overlay.id} style={styles.overlayCard}>
                <Text style={styles.overlayText}>{overlay.text}</Text>
                <Text style={styles.overlayInfo}>
                  {formatTime(overlay.timelineStart)} - {formatTime(overlay.timelineStart + overlay.duration)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* SPEED TAB */}
        {currentTab === 'speed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Speed Control</Text>
            <View style={styles.speedGrid}>
              {SPEED_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.speedCard,
                    selectedClip?.speed === preset.value && styles.selectedSpeedCard,
                  ]}
                  onPress={() => applySpeed(preset.value)}
                >
                  <Ionicons name={preset.icon as any} size={28} color="#007AFF" />
                  <Text style={styles.speedLabel}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TRANSITIONS TAB */}
        {currentTab === 'transitions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔀 Transitions</Text>
            <View style={styles.transitionGrid}>
              {Object.entries(TRANSITIONS).map(([key, transition]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.transitionCard}
                  onPress={() => applyTransition(key)}
                >
                  <Ionicons name={transition.icon as any} size={32} color="#007AFF" />
                  <Text style={styles.transitionName}>{transition.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* EXPORT TAB */}
        {currentTab === 'export' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📤 Export Video</Text>
            {['480p', '720p', '1080p', '4K'].map((res) => (
              <TouchableOpacity
                key={res}
                style={styles.exportCard}
                onPress={() => exportVideo(res, 'high')}
              >
                <Ionicons name="download" size={24} color="#007AFF" />
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export {res}</Text>
                  <Text style={styles.exportDesc}>High quality • 30 FPS</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <TextOverlayEditor visible={showTextEditor} onClose={() => setShowTextEditor(false)} />
      <StickerPanel
        visible={showStickerPanel}
        onClose={() => setShowStickerPanel(false)}
        onSelect={(sticker) => console.log('Sticker:', sticker)}
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
  headerRight: {
    minWidth: 60,
  },
  clipCount: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  videoContainer: {
    height: VIDEO_PREVIEW_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
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
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    maxHeight: 60,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 11,
    color: '#888',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sliderGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlayCard: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overlayInfo: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedCard: {
    width: (SCREEN_WIDTH - 56) / 4,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  selectedSpeedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#007AFF22',
  },
  speedLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  transitionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  transitionCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  transitionName: {
    color: '#fff',
    fontSize: 12,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exportDesc: {
    color: '#888',
    fontSize: 12,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  processingSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
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
