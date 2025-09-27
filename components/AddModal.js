// components/AddModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../Constants/Colors';
import ColorSelector from './ColorSelector';

const colorList = [
  "blue", "teal", "green", "olive", "yellow", 
  "orange", "red", "pink", "purple", "blueGray"
];

export default function AddModal({ visible, onClose, onAddNote, onAddTodo }) {
  const [selectedOption, setSelectedOption] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(Colors.blue);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setColor(Colors.blue);
  };

  const handleAdd = () => {
    if (!title.trim()) return;

    if (selectedOption === 'note') {
      onAddNote({
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString()
      });
    } else {
      onAddTodo({
        title: title.trim(),
        color: color,
        createdAt: new Date().toISOString()
      });
    }

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionSelector}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'note' && styles.optionButtonActive
              ]}
              onPress={() => setSelectedOption('note')}
            >
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={selectedOption === 'note' ? 'white' : Colors.blue} 
              />
              <Text style={[
                styles.optionText,
                selectedOption === 'note' && styles.optionTextActive
              ]}>
                Note
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'todo' && styles.optionButtonActive
              ]}
              onPress={() => setSelectedOption('todo')}
            >
              <Ionicons 
                name="checklist-outline" 
                size={20} 
                color={selectedOption === 'todo' ? 'white' : Colors.blue} 
              />
              <Text style={[
                styles.optionText,
                selectedOption === 'todo' && styles.optionTextActive
              ]}>
                Todo List
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title"
                placeholderTextColor={Colors.lightGray}
                maxLength={50}
              />
              <Text style={styles.charCount}>{title.length}/50</Text>
            </View>

            {selectedOption === 'note' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Start typing your note..."
                  placeholderTextColor={Colors.lightGray}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={6}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Color</Text>
                <ColorSelector
                  onSelect={setColor}
                  selectedColor={color}
                  colorOptions={colorList}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.addButton,
                { backgroundColor: selectedOption === 'note' ? Colors.blue : color },
                !title.trim() && styles.addButtonDisabled
              ]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <Text style={styles.addButtonText}>
                Add {selectedOption === 'note' ? 'Note' : 'Todo List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  closeButton: {
    padding: 5,
  },
  optionSelector: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.blue,
  },
  optionButtonActive: {
    backgroundColor: Colors.blue,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.blue,
  },
  optionTextActive: {
    color: 'white',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: Colors.black,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.lightGray,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  addButton: {
    flex: 2,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});