import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STICKER_CATEGORIES } from '../utils/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: string) => void;
}

export default function StickerPanel({ visible, onClose, onSelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof STICKER_CATEGORIES>('emoji');

  const handleStickerSelect = (sticker: string) => {
    onSelect(sticker);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Stickers</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {Object.entries(STICKER_CATEGORIES).map(([key, category]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryTab,
                  selectedCategory === key && styles.selectedCategoryTab,
                ]}
                onPress={() => setSelectedCategory(key as keyof typeof STICKER_CATEGORIES)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={selectedCategory === key ? '#007AFF' : '#888'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === key && styles.selectedCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sticker Grid */}
          <ScrollView style={styles.content}>
            <View style={styles.stickerGrid}>
              {STICKER_CATEGORIES[selectedCategory].stickers.map((sticker, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stickerButton}
                  onPress={() => handleStickerSelect(sticker)}
                >
                  <Text style={styles.stickerText}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
    maxHeight: '70%',
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
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  selectedCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#007AFF',
  },
  content: {
    padding: 16,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stickerButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerText: {
    fontSize: 32,
  },
});