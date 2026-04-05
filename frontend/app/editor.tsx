import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../src/store/editorStore';
import type { VideoClip, FilterEffect } from '../src/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_PREVIEW_HEIGHT = 300;

export default function EditorScreen() {
  const videoRef = useRef<Video>(null);
  const [
    currentTab,
    setCurrentTab,
  ] = useState<'trim' | 'filters' | 'text' | 'export'>('trim');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  
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
  } = useEditorStore();

  const currentAsset = assets[0];
  const currentClip = clips.find(c => c.id === selectedClipId);

  useEffect(() => {
    if (currentAsset && clips.length === 0) {
      // Create initial clip from the full video
      const initialClip: VideoClip = {
        id: Date.now().toString(),
        assetId: currentAsset.id,
        startTime: 0,
        endTime: currentAsset.duration / 1000, // Convert to seconds
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
      Alert.alert('Success', 'Video trimmed successfully!');
    }
  };

  const addFilter = (filterType: FilterEffect['type'], intensity: number = 0.5) => {
    if (currentClip) {
      const newFilter: FilterEffect = { type: filterType, intensity };
      const existingFilters = currentClip.filters.filter(f => f.type !== filterType);
      updateClip(currentClip.id, {
        filters: [...existingFilters, newFilter],
      });
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
        
        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={32} 
              color="#fff" 
            />
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'trim' && styles.activeTab]}
          onPress={() => setCurrentTab('trim')}
        >
          <Ionicons name="cut-outline" size={20} color={currentTab === 'trim' ? '#007AFF' : '#888'} />
          <Text style={[styles.tabText, currentTab === 'trim' && styles.activeTabText]}>Trim</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'filters' && styles.activeTab]}
          onPress={() => setCurrentTab('filters')}
        >
          <Ionicons name="color-filter-outline" size={20} color={currentTab === 'filters' ? '#007AFF' : '#888'} />
          <Text style={[styles.tabText, currentTab === 'filters' && styles.activeTabText]}>Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'text' && styles.activeTab]}
          onPress={() => setCurrentTab('text')}
        >
          <Ionicons name="text-outline" size={20} color={currentTab === 'text' ? '#007AFF' : '#888'} />
          <Text style={[styles.tabText, currentTab === 'text' && styles.activeTabText]}>Text</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'export' && styles.activeTab]}
          onPress={() => setCurrentTab('export')}
        >
          <Ionicons name="download-outline" size={20} color={currentTab === 'export' ? '#007AFF' : '#888'} />
          <Text style={[styles.tabText, currentTab === 'export' && styles.activeTabText]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer}>
        {currentTab === 'trim' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Trim Video</Text>
            <View style={styles.trimControls}>
              <View style={styles.trimControl}>
                <Text style={styles.label}>Start Time: {formatTime(trimStart)}</Text>
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
                <Text style={styles.label}>End Time: {formatTime(trimEnd)}</Text>
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
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('brightness', 0.6)}
              >
                <Ionicons name="sunny-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Brightness</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('contrast', 0.6)}
              >
                <Ionicons name="contrast-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Contrast</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('saturation', 0.6)}
              >
                <Ionicons name="color-palette-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Saturation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('blur', 0.3)}
              >
                <Ionicons name="ellipse-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Blur</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('grayscale', 1)}
              >
                <Ionicons name="images-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Grayscale</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => addFilter('sepia', 0.8)}
              >
                <Ionicons name="cafe-outline" size={32} color="#007AFF" />
                <Text style={styles.filterText}>Sepia</Text>
              </TouchableOpacity>
            </View>
            {currentClip && currentClip.filters.length > 0 && (
              <View style={styles.activeFilters}>
                <Text style={styles.label}>Active Filters:</Text>
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
            <Text style={styles.comingSoon}>Text overlay feature coming soon!</Text>
          </View>
        )}

        {currentTab === 'export' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Export Video</Text>
            <View style={styles.exportOptions}>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export 720p</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export 1080p</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export 4K</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.comingSoon}>Export functionality coming soon!</Text>
          </View>
        )}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
  },
  activeTabText: {
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