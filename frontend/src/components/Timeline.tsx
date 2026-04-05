import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '../store/editorStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_HEIGHT = 60;
const PIXELS_PER_SECOND = 50;

export default function Timeline() {
  const { clips, currentTime, setCurrentTime, timelineZoom, selectedClipId, setSelectedClip } = useEditorStore();
  
  const totalDuration = clips.reduce((max, clip) => Math.max(max, clip.timelineStart + clip.duration), 0);
  const timelineWidth = Math.max(SCREEN_WIDTH, totalDuration * PIXELS_PER_SECOND * timelineZoom);

  const handleSeek = (position: number) => {
    const time = position / (PIXELS_PER_SECOND * timelineZoom);
    setCurrentTime(time);
  };

  return (
    <View style={styles.container}>
      {/* Time ruler */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ruler}>
        <View style={[styles.rulerContent, { width: timelineWidth }]}>
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <View key={i} style={[styles.rulerMark, { left: i * PIXELS_PER_SECOND * timelineZoom }]}>
              <View style={styles.rulerLine} />
              <Text style={styles.rulerText}>{i}s</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Video track */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.track, { width: timelineWidth }]}>
          <Text style={styles.trackLabel}>Video</Text>
          <View style={styles.trackContent}>
            {clips.map((clip) => (
              <TouchableOpacity
                key={clip.id}
                style={[
                  styles.clip,
                  {
                    left: clip.timelineStart * PIXELS_PER_SECOND * timelineZoom,
                    width: clip.duration * PIXELS_PER_SECOND * timelineZoom,
                  },
                  selectedClipId === clip.id && styles.selectedClip,
                ]}
                onPress={() => setSelectedClip(clip.id)}
              >
                <Ionicons name="videocam" size={16} color="#fff" />
                <Text style={styles.clipText} numberOfLines={1}>
                  {clip.duration.toFixed(1)}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Playhead */}
      <View 
        style={[
          styles.playhead,
          { left: currentTime * PIXELS_PER_SECOND * timelineZoom },
        ]}
        pointerEvents="none"
      >
        <View style={styles.playheadHandle} />
        <View style={styles.playheadLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  ruler: {
    height: 30,
    backgroundColor: '#0C0C0C',
  },
  rulerContent: {
    height: 30,
    position: 'relative',
  },
  rulerMark: {
    position: 'absolute',
    height: 30,
    alignItems: 'center',
  },
  rulerLine: {
    width: 1,
    height: 10,
    backgroundColor: '#666',
  },
  rulerText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  track: {
    height: TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  trackLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    width: 60,
    paddingLeft: 8,
  },
  trackContent: {
    flex: 1,
    height: TRACK_HEIGHT - 10,
    position: 'relative',
  },
  clip: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0056B3',
  },
  selectedClip: {
    borderColor: '#FFCC00',
    borderWidth: 2,
  },
  clipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 100,
  },
  playheadHandle: {
    width: 12,
    height: 12,
    backgroundColor: '#FF0000',
    borderRadius: 6,
    marginLeft: -5,
    marginTop: 20,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#FF0000',
  },
});