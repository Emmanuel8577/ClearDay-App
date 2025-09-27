// screens/NotesScreen.js
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Text,
  Modal,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../Constants/Colors';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const ColorPickerModal = ({ visible, onClose, selectedColor, onColorSelect }) => {
  const colors = [
    { color: '#E3F2FD', name: 'Light Blue' },
    { color: '#F3E5F5', name: 'Lavender' },
    { color: '#E8F5E8', name: 'Mint' },
    { color: '#FFF3E0', name: 'Cream' },
    { color: '#FCE4EC', name: 'Blush' },
    { color: '#FFFFFF', name: 'White' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.colorModalContent}>
          <Text style={styles.colorModalTitle}>Choose Note Color</Text>
          <View style={styles.colorGrid}>
            {colors.map((item) => (
              <TouchableOpacity
                key={item.color}
                style={styles.colorModalOption}
                onPress={() => {
                  onColorSelect(item.color);
                  onClose();
                }}
              >
                <View style={[
                  styles.colorModalCircle,
                  { backgroundColor: item.color },
                  selectedColor === item.color && styles.colorModalCircleSelected
                ]}>
                  {selectedColor === item.color && (
                    <Ionicons name="checkmark" size={20} color="#333" />
                  )}
                </View>
                <Text style={styles.colorName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const NotebookLines = ({ lineColor = 'rgba(0,0,0,0.08)', backgroundColor = '#FFFFFF' }) => {
  const lineHeight = 28;
  const numberOfLines = Math.ceil(screenHeight / lineHeight) + 20;
  
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none">
      <View style={[styles.marginLine, { left: 25, backgroundColor: 'rgba(0,0,0,0.15)' }]} />
      
      {Array.from({ length: numberOfLines }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.notebookLine,
            {
              top: 60 + (index * lineHeight),
              backgroundColor: lineColor,
              left: 40,
              right: 20,
            }
          ]}
        />
      ))}
    </View>
  );
};

export default function NotesScreen({ navigation, route }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(route.params?.color || '#FFFFFF');
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState(route.params?.noteId);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity 
            style={styles.colorPickerButton}
            onPress={() => setShowColorPicker(true)}
          >
            <Ionicons name="color-palette" size={22} color={getContrastColor(color)} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getContrastColor(color) }]} numberOfLines={1}>
            {title || 'New Note'}
          </Text>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={getContrastColor(color)} 
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSaveButtonPress}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
        >
          <Ionicons 
            name={isSaving ? "time-outline" : "checkmark"} 
            size={24} 
            color={getContrastColor(color)} 
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: color,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: getContrastColor(color),
    });
  }, [navigation, title, color, isSaving]);

  const getContrastColor = (bgColor) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const handleBackPress = async () => {
    if (hasUnsavedChanges) {
      await saveNote();
    }
    navigation.goBack();
  };

  const handleSaveButtonPress = async () => {
    await saveNote();
    navigation.goBack();
  };

  const loadNote = async () => {
    if (!noteId) {
      setHasUnsavedChanges(true);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);
      
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        setContent(noteData.content || '');
        setTitle(noteData.title || '');
        setColor(noteData.color || '#FFFFFF');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const saveNote = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Don't save if there's no content and no title
    if (!content.trim() && !title.trim()) {
      return true;
    }

    setIsSaving(true);

    // Use custom title or first line of content as fallback
    const noteTitle = title.trim() || content.split('\n')[0]?.substring(0, 50) || 'Untitled Note';
    
    try {
      const noteData = {
        title: noteTitle,
        content: content,
        color: color,
        updatedAt: new Date()
      };

      if (!noteId) {
        // Create new note
        noteData.createdAt = new Date();
        const userNotesRef = collection(db, 'users', user.uid, 'notes');
        const docRef = await addDoc(userNotesRef, noteData);
        setNoteId(docRef.id);
      } else {
        // Update existing note
        const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
        await updateDoc(noteRef, noteData);
      }
      
      setIsSaving(false);
      setHasUnsavedChanges(false);
      
      // Update the title in state if it was auto-generated from content
      if (!title.trim() && content.trim()) {
        setTitle(noteTitle);
      }
      
      return true;
      
    } catch (error) {
      console.error('Error saving note:', error);
      setIsSaving(false);
      return false;
    }
  }, [title, content, color, noteId]);

  const handleContentChange = (text) => {
    setContent(text);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (text) => {
    setTitle(text);
    setHasUnsavedChanges(true);
  };

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      if (title.trim() || content.trim()) {
        saveNote();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [title, content, color, hasUnsavedChanges]);

  // Handle hardware back button on Android
  useEffect(() => {
    const handleBackPress = () => {
      if (hasUnsavedChanges) {
        saveNote().then(() => {
          navigation.goBack();
        });
        return true;
      }
      return false;
    };

    let backHandler;
    if (Platform.OS === 'android') {
      backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    }

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [navigation, hasUnsavedChanges]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: color }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.notebookContainer}>
        <ScrollView 
          style={styles.contentArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <NotebookLines 
            lineColor={getContrastColor(color) + '30'} 
            backgroundColor={color}
          />
          
          {/* Title Input */}
          <View style={styles.titleArea}>
            <TextInput
              style={[styles.titleInput, { color: getContrastColor(color) }]}
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Note Title"
              placeholderTextColor={getContrastColor(color) + '80'}
              multiline={true}
              textAlignVertical="top"
              scrollEnabled={false}
              maxLength={100}
              autoFocus={!title && !content}
              returnKeyType="next"
            />
          </View>

          {/* Content Input */}
          <View style={styles.writingArea}>
            <TextInput
              style={[styles.contentInput, { color: getContrastColor(color) }]}
              value={content}
              onChangeText={handleContentChange}
              placeholder="Start writing your thoughts..."
              placeholderTextColor={getContrastColor(color) + '80'}
              multiline={true}
              textAlignVertical="top"
              scrollEnabled={false}
              autoFocus={!!title && !content}
            />
          </View>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <ColorPickerModal
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={color}
        onColorSelect={(newColor) => {
          setColor(newColor);
          setHasUnsavedChanges(true);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: 10,
  },
  colorPickerButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  notebookContainer: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    minHeight: screenHeight,
  },
  titleArea: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
    marginLeft: 25,
    minHeight: 80,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    padding: 0,
    backgroundColor: 'transparent',
    textAlign: 'left',
  },
  writingArea: {
    paddingHorizontal: 40,
    paddingTop: 10,
    marginLeft: 25,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 28,
    padding: 0,
    backgroundColor: 'transparent',
    minHeight: screenHeight - 150,
    textAlign: 'left',
  },
  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  notebookLine: {
    position: 'absolute',
    height: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 60,
    maxWidth: 400,
  },
  colorModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorModalOption: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 20,
  },
  colorModalCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorModalCircleSelected: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});