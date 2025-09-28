// screens/Home.js
import React, { useLayoutEffect, useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import Colors from "../Constants/Colors";
import { auth, db } from "./firebaseConfig";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

const colorOptions = [
  Colors.blue,
  Colors.green,
  Colors.red,
  Colors.purple,
  Colors.orange,
  Colors.pink,
  Colors.teal,
  Colors.yellow,
];

const ColorSelector = ({ selectedColor, onColorSelect }) => {
  return (
    <View style={styles.colorSelector}>
      <Text style={styles.colorSelectorTitle}>Choose Color:</Text>
      <View style={styles.colorOptions}>
        {colorOptions.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption,
            ]}
            onPress={() => onColorSelect(color)}
          >
            {selectedColor === color && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const EditModal = ({ visible, onClose, item, onUpdate, onDelete }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(Colors.blue);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setSelectedColor(item.color || Colors.blue);
    }
  }, [item]);

  const handleUpdate = async () => {
    if (!title.trim()) return;
    
    await onUpdate(item.id, item.type, { title: title.trim(), color: selectedColor });
    onClose();
  };

  const handleDelete = async () => {
    await onDelete(item.id, item.type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit {item?.type === 'note' ? 'Note' : 'Todo List'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title:</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              maxLength={50}
            />

            <ColorSelector
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdate}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ListButton = ({ title, color, onEdit, onDelete, navigation, listid, type, subtitle, content }) => {
  const handlePress = () => {
    setTimeout(() => {
      if (type === 'note') {
        navigation.navigate("NotesScreen", { 
          title, 
          noteId: listid, 
          color 
        });
      } else {
        // Simply navigate to the existing TodoList without creating a new one
        navigation.navigate("TodoList", { 
          title, 
          color, 
          listid 
        });
      }
    }, 100);
  };

  // Generate a better subtitle from content
  const getContentPreview = () => {
    if (subtitle) return subtitle;
    
    if (content) {
      const cleanContent = content.replace(/\n+/g, ' ').trim();
      const preview = cleanContent.substring(0, 60);
      return cleanContent.length > 60 ? preview + '...' : preview;
    }
    
    return 'No content yet';
  };

  const contentPreview = getContentPreview();

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.itemContainer, { backgroundColor: color }]}
      activeOpacity={0.7}
    >
      <View style={styles.listContent}>
        <View style={styles.titleRow}>
          <Ionicons 
            name={type === 'note' ? 'document-text' : 'list'} 
            size={20} 
            color="white" 
            style={styles.typeIcon}
          />
          <View style={styles.textContainer}>
            <Text style={styles.itemTitle}>{title}</Text>
            {type === 'note' && (
              <Text style={styles.itemSubtitle} numberOfLines={2}>
                {contentPreview}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemType}>
            {type === 'note' ? 'Notes' : 'Todo List'}
          </Text>
          {type === 'note' && contentPreview !== 'No content yet' && (
            <Text style={styles.charCount}>
              {contentPreview.length > 60 ? '60+' : contentPreview.length} chars
            </Text>
          )}
        </View>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const AddModal = ({ visible, onClose, onSelectType }) => {
  const handleTypeSelect = (type) => {
    onSelectType(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose what you want to create:
            </Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={styles.typeOption}
                onPress={() => handleTypeSelect("note")}
              >
                <Ionicons 
                  name="document-text" 
                  size={32} 
                  color={Colors.blue} 
                />
                <Text style={styles.typeText}>
                  Notes
                </Text>
                <Text style={styles.typeDescription}>
                  Create detailed notes with rich content
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.typeOption}
                onPress={() => handleTypeSelect("todo")}
              >
                <Ionicons 
                  name="list" 
                  size={32} 
                  color={Colors.green} 
                />
                <Text style={styles.typeText}>
                  Todo List
                </Text>
                <Text style={styles.typeDescription}>
                  Create task lists with checkboxes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function Home({ navigation }) {
  const [lists, setLists] = useState([]);
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.log("No user authenticated");
      return;
    }

    console.log("Setting up listeners for user:", user.uid);

    const userListsRef = collection(db, "users", user.uid, "lists");
    const listsQuery = query(userListsRef, orderBy("createdAt", "desc"));

    const unsubscribeLists = onSnapshot(listsQuery, 
      (snapshot) => {
        console.log("Lists snapshot received, count:", snapshot.size);
        const listsData = [];
        snapshot.forEach((doc) => {
          listsData.push({ id: doc.id, ...doc.data(), type: 'todo' });
        });
        setLists(listsData);
      },
      (error) => {
        console.error("Error fetching lists:", error);
      }
    );

    const userNotesRef = collection(db, "users", user.uid, "notes");
    const notesQuery = query(userNotesRef, orderBy("updatedAt", "desc"));

    const unsubscribeNotes = onSnapshot(notesQuery, 
      (snapshot) => {
        console.log("Notes snapshot received, count:", snapshot.size);
        const notesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Generate subtitle from content
          let subtitle = 'No content yet';
          if (data.content && data.content.trim()) {
            const cleanContent = data.content.replace(/\n+/g, ' ').trim();
            subtitle = cleanContent.substring(0, 60);
            if (cleanContent.length > 60) {
              subtitle += '...';
            }
          }
          
          notesData.push({ 
            id: doc.id, 
            ...data, 
            type: 'note',
            subtitle,
            content: data.content || ''
          });
        });
        setNotes(notesData);
      },
      (error) => {
        console.error("Error fetching notes:", error);
      }
    );

    return () => {
      unsubscribeLists();
      unsubscribeNotes();
    };
  }, []);

  const handleTypeSelect = async (type) => {
  const user = auth.currentUser;
  if (!user) return;

  if (type === 'todo') {
    // Navigate to TodoList screen for creation without automatically creating a new list
    navigation.navigate("TodoList", { 
      title: 'New Todo List', 
      color: Colors.blue, 
      listid: null // Pass null to indicate it's a new list
    });
  } else {
    // Navigate to NotesScreen for creation
    navigation.navigate("NotesScreen", { 
      title: 'New Note', 
      noteId: null,
      color: Colors.blue
    });
  }
};

  const updateItem = async (id, type, updates) => {
    const user = auth.currentUser;
    if (!user) return;

    const collectionName = type === 'note' ? 'notes' : 'lists';
    const itemDocRef = doc(db, "users", user.uid, collectionName, id);
    await updateDoc(itemDocRef, {
      ...updates,
      updatedAt: new Date()
    });
  };

  const removeItem = async (id, type) => {
    const user = auth.currentUser;
    if (!user) return;

    const collectionName = type === 'note' ? 'notes' : 'lists';
    const itemDocRef = doc(db, "users", user.uid, collectionName, id);
    await deleteDoc(itemDocRef);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalVisible(true);
  };

  const handleDelete = (id, type) => {
    removeItem(id, type);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const allItems = [...lists, ...notes].sort((a, b) => {
    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || a.createdAt);
    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || b.createdAt);
    return dateB - dateA;
  });

  console.log("Total items:", allItems.length, "Lists:", lists.length, "Notes:", notes.length);

  return (
    <View style={styles.container}>
      {allItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="add-circle-outline" size={64} color={Colors.lightGray} />
          <Text style={styles.emptyText}>No items yet!</Text>
          <Text style={styles.emptySubtext}>Tap the + button above to create your first note or todo list</Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <ListButton
              title={item.title}
              color={item.color || (item.type === 'note' ? Colors.blue : Colors.green)}
              listid={item.id}
              type={item.type}
              subtitle={item.subtitle}
              content={item.content}
              navigation={navigation}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id, item.type)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectType={handleTypeSelect}
      />

      <EditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        item={selectedItem}
        onUpdate={updateItem}
        onDelete={removeItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  listContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
    padding: 5,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 90,
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  listContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  typeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    color: "white",
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: 'italic',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemType: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  typeSelector: {
    gap: 15,
  },
  typeOption: {
    alignItems: 'center',
    padding: 25,
    borderWidth: 2,
    borderColor: Colors.blue,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  typeText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.blue,
    textAlign: 'center',
  },
  typeDescription: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  // Edit Modal Styles
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  colorSelector: {
    marginBottom: 30,
  },
  colorSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: Colors.red,
  },
  updateButton: {
    backgroundColor: Colors.green,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});