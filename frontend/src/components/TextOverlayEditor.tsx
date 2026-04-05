import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../store/editorStore';
import { TEXT_STYLES, TEXT_ANIMATIONS } from '../utils/constants';
import type { TextOverlay } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TextOverlayEditor({ visible, onClose }: Props) {
  const { addTextOverlay, currentTime } = useEditorStore();
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [selectedStyle, setSelectedStyle] = useState('basic');
  const [duration, setDuration] = useState(3);

  const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'];

  const handleAdd = () => {
    if (!text.trim()) return;

    const overlay: TextOverlay = {
      id: Date.now().toString(),
      text: text.trim(),
      timelineStart: currentTime,
      duration,
      position: { x: 0.5, y: 0.5 },
      fontSize,
      color,
      fontWeight: 'normal',
      backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
      alignment: 'center',
    };

    addTextOverlay(overlay);
    setText('');
    onClose();
  };

  const applyStyle = (styleId: string) => {
    const style = TEXT_STYLES.find(s => s.id === styleId);
    if (style) {
      setFontSize(style.fontSize);
      setColor(style.color);
      setBackgroundColor(style.backgroundColor);
      setSelectedStyle(styleId);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Text</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
              multiline
            />

            {/* Style Presets */}
            <Text style={styles.sectionTitle}>Styles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.stylesContainer}>
                {TEXT_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.styleButton,
                      selectedStyle === style.id && styles.selectedStyleButton,
                    ]}
                    onPress={() => applyStyle(style.id)}
                  >
                    <Text style={styles.styleText}>{style.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Font Size */}
            <Text style={styles.sectionTitle}>Font Size: {fontSize}</Text>
            <Slider
              style={styles.slider}
              minimumValue={16}
              maximumValue={72}
              value={fontSize}
              onValueChange={setFontSize}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#444"
              thumbTintColor="#007AFF"
            />

            {/* Text Color */}
            <Text style={styles.sectionTitle}>Text Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorContainer}>
                {colors.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorButton,
                      { backgroundColor: c },
                      color === c && styles.selectedColor,
                    ]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Background Color */}
            <Text style={styles.sectionTitle}>Background</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorContainer}>
                <TouchableOpacity
                  style={[
                    styles.colorButton,
                    styles.transparentButton,
                    backgroundColor === 'transparent' && styles.selectedColor,
                  ]}
                  onPress={() => setBackgroundColor('transparent')}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                {colors.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorButton,
                      { backgroundColor: c + '88' },
                      backgroundColor === c + '88' && styles.selectedColor,
                    ]}
                    onPress={() => setBackgroundColor(c + '88')}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Duration */}
            <Text style={styles.sectionTitle}>Duration: {duration.toFixed(1)}s</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={10}
              value={duration}
              onValueChange={setDuration}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#444"
              thumbTintColor="#007AFF"
            />

            {/* Preview */}
            <View style={styles.preview}>
              <Text
                style={[
                  styles.previewText,
                  {
                    fontSize: fontSize / 2,
                    color,
                    backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
                  },
                ]}
              >
                {text || 'Preview'}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add to Timeline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#000',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#1C1C1E',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    minHeight: 60,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  stylesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  selectedStyleButton: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF22',
  },
  styleText: {
    color: '#fff',
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFCC00',
  },
  transparentButton: {
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  previewText: {
    textAlign: 'center',
    padding: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});