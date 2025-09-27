// screens/TodoList.js
import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Dimensions,
  StatusBar,
  Keyboard,
  TextInput,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../Constants/Colors";
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function TodoList({ navigation, route }) {
  const [todoItems, setTodoItems] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [currentListId, setCurrentListId] = useState(null);
  const newItemInputRef = useRef(null);

  // Get the list name from route params or use default
  const listName = route.params?.listName || 'New TodoList';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: listName,
      headerRight: () => (
        <TouchableOpacity onPress={startAddingNew} style={styles.headerButton}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, listName]);

  // Load todos from Firestore when component mounts or listName changes
  useEffect(() => {
    loadTodosFromFirestore();
  }, [listName]);

  // Save todos to Firestore whenever todoItems changes
  useEffect(() => {
    if (currentListId && todoItems.length > 0) {
      saveTodosToFirestore();
    }
  }, [todoItems, currentListId]);

  const loadTodosFromFirestore = async () => {
    try {
      // Query for the todo list with the given name
      const listsRef = firestore().collection('todoLists');
      const querySnapshot = await listsRef.where('name', '==', listName).get();
      
      if (!querySnapshot.empty) {
        // List exists, get the first matching document
        const listDoc = querySnapshot.docs[0];
        setCurrentListId(listDoc.id);
        
        const listData = listDoc.data();
        if (listData.items && Array.isArray(listData.items)) {
          setTodoItems(listData.items);
        } else {
          setTodoItems([]);
        }
      } else {
        // List doesn't exist, create a new one
        const newListRef = await listsRef.add({
          name: listName,
          items: [],
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
        setCurrentListId(newListRef.id);
        setTodoItems([]);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert("Error", "Failed to load todos");
    }
  };

  const saveTodosToFirestore = async () => {
    try {
      if (!currentListId) return;

      await firestore().collection('todoLists').doc(currentListId).update({
        items: todoItems,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving todos:', error);
      Alert.alert("Error", "Failed to save todos");
    }
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setNewTodoText('');
  };

  const cancelAddingNew = () => {
    setIsAddingNew(false);
    setNewTodoText('');
    Keyboard.dismiss();
  };

  const addNewTodo = async () => {
    if (!newTodoText.trim()) return;

    const newTodo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      isChecked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedItems = [...todoItems, newTodo];
    setTodoItems(updatedItems);
    setIsAddingNew(false);
    setNewTodoText('');
  };

  const toggleItemChecked = (itemId) => {
    setTodoItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, isChecked: !item.isChecked, updatedAt: new Date() }
          : item
      )
    );
  };

  const updateItemText = (itemId, newText) => {
    if (!newText.trim()) return;

    setTodoItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, text: newText.trim(), updatedAt: new Date() }
          : item
      )
    );
  };

  const deleteItem = (itemId) => {
    Alert.alert(
      "Delete Todo",
      "Are you sure you want to delete this todo?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setTodoItems(prevItems => prevItems.filter(item => item.id !== itemId));
          }
        }
      ]
    );
  };

  const completedCount = todoItems.filter(item => item.isChecked).length;
  const totalCount = todoItems.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.green }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.orange }]}>{totalCount - completedCount}</Text>
          <Text style={styles.statLabel}>Left</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { 
            color: totalCount > 0 ? (completedCount === totalCount ? Colors.green : Colors.blue) : Colors.gray 
          }]}>
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* New Todo Input (shown at top when adding) */}
      {isAddingNew && (
        <View style={styles.newTodoContainer}>
          <View style={styles.newTodoCard}>
            <TextInput
              ref={newItemInputRef}
              style={styles.newTodoInput}
              placeholder="What needs to be done?"
              placeholderTextColor={Colors.lightGray}
              value={newTodoText}
              onChangeText={setNewTodoText}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={addNewTodo}
              blurOnSubmit={true}
            />
            
            <View style={styles.newTodoActions}>
              <View style={styles.newTodoButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelAddingNew}
                >
                  <Ionicons name="close" size={20} color={Colors.red} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton, !newTodoText.trim() && styles.saveButtonDisabled]}
                  onPress={addNewTodo}
                  disabled={!newTodoText.trim()}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Todo List */}
      {todoItems.length === 0 && !isAddingNew ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkbox-outline" size={80} color={Colors.lightGray} />
          </View>
          <Text style={styles.emptyText}>No todos yet!</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first todo</Text>
        </View>
      ) : (
        <FlatList
          data={todoItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItemCard
              item={item}
              onToggle={() => toggleItemChecked(item.id)}
              onTextChange={(newText) => updateItemText(item.id, newText)}
              onDelete={() => deleteItem(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            isAddingNew && styles.listContentWithNewItem
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const TodoItemCard = ({ item, onToggle, onTextChange, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);

  useEffect(() => {
    setEditText(item.text);
  }, [item.text]);

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onTextChange(editText);
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.todoCard}>
      <View style={styles.todoItemContainer}>
        <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            item.isChecked && { backgroundColor: Colors.blue }
          ]}>
            {item.isChecked && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
        </TouchableOpacity>

        <View style={styles.todoContentContainer}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                ref={editInputRef}
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                onBlur={handleSave}
                onSubmitEditing={handleSave}
                multiline
                textAlignVertical="top"
                blurOnSubmit={true}
              />
            </View>
          ) : (
            <TouchableOpacity 
              onLongPress={() => setIsEditing(true)} 
              style={styles.todoTextContainer}
              onPress={onToggle}
            >
              <Text style={[
                styles.todoText,
                item.isChecked && styles.completedText
              ]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <TouchableOpacity onPress={handleCancel} style={styles.actionButton}>
            <Ionicons name="close" size={20} color={Colors.red} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ... (styles remain the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerButton: {
    marginRight: 15,
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: Colors.lightestGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    minWidth: 70,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.blue,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  newTodoContainer: {
    padding: 15,
    backgroundColor: Colors.lightestGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  newTodoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newTodoInput: {
    borderWidth: 2,
    borderColor: Colors.blue,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  newTodoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newTodoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: Colors.red,
  },
  saveButton: {
    backgroundColor: Colors.blue,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.lightGray,
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightestGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingVertical: 10,
  },
  listContentWithNewItem: {
    paddingTop: 0,
  },
  todoCard: {
    marginHorizontal: 15,
    marginVertical: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  todoContentContainer: {
    flex: 1,
  },
  editContainer: {
    flex: 1,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: Colors.black,
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.gray,
    opacity: 0.6,
  },
  editInput: {
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 8,
    backgroundColor: Colors.white,
    minHeight: 40,
    textAlignVertical: 'top',
  },
});