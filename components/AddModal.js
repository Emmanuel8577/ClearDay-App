import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddModal({ visible, onClose, navigation, theme }) {
  const handleNavigation = (screenName) => {
    onClose();

    if (screenName === 'TodoList') {
      navigation.navigate('TodoList', {
        listid: `local_${Date.now()}`,
        title: "New Task List",
        color: theme?.primary || '#6366F1'
      });
    } else if (screenName === 'Notes') {
      // FIX: Generate the missing noteId here!
      navigation.navigate('Notes', {
        noteId: `note_${Date.now()}`, 
        initialTitle: "",
        initialContent: "",
        color: theme?.primary || '#6366F1'
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme?.surface || 'white' }]}>
          <Text style={[styles.modalTitle, { color: theme?.text || '#333' }]}>Quick Actions</Text>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={styles.tab} 
              onPress={() => handleNavigation('Notes')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="document-text" size={32} color="#2196F3" />
              </View>
              <Text style={[styles.tabText, { color: theme?.textSecondary || '#555' }]}>Take Note</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tab} 
              onPress={() => handleNavigation('TodoList')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FBE9E7' }]}>
                <Ionicons name="checkbox" size={32} color="#FF5722" />
              </View>
              <Text style={[styles.tabText, { color: theme?.textSecondary || '#555' }]}>Tasks</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '700',
  },
});