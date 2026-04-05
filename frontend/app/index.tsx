import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '../src/store/editorStore';

export default function HomeScreen() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { createProject, addAsset, resetEditor } = useEditorStore();

  const requestPermissions = async () => {
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please enable camera and media library permissions to use this app.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        setSelectedVideo(video.uri);
        
        // Create a new project
        createProject('New Project');
        
        // Add video asset
        addAsset({
          id: Date.now().toString(),
          uri: video.uri,
          duration: video.duration || 0,
          width: video.width || 1920,
          height: video.height || 1080,
          fileName: video.fileName || 'video.mp4',
          fileSize: video.fileSize || 0,
        });
        
        // Navigate to editor
        router.push('/editor');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const recordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        setSelectedVideo(video.uri);
        
        createProject('New Project');
        addAsset({
          id: Date.now().toString(),
          uri: video.uri,
          duration: video.duration || 0,
          width: video.width || 1920,
          height: video.height || 1080,
          fileName: video.fileName || 'video.mp4',
          fileSize: video.fileSize || 0,
        });
        
        router.push('/editor');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const startNewProject = () => {
    resetEditor();
    pickVideo();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="film-outline" size={48} color="#007AFF" />
        <Text style={styles.title}>Video Editor</Text>
        <Text style={styles.subtitle}>Create amazing videos</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={startNewProject}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>New Project</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={recordVideo}>
          <Ionicons name="videocam-outline" size={24} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Record Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Features</Text>
        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <Ionicons name="cut-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Trim & Cut</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="color-filter-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Filters</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="text-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Text Overlays</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="git-merge-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Transitions</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="speedometer-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Speed Control</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="download-outline" size={32} color="#007AFF" />
            <Text style={styles.featureText}>Export 4K</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  featuresContainer: {
    marginTop: 48,
    paddingHorizontal: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});