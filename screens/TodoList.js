// screens/TodoList.js
import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Keyboard,
  TextInput // ADD THIS IMPORT
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../Constants/Colors";
import { auth, db } from "./firebaseConfig";
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function TodoList({ navigation, route }) {
  const [todoItems, setTodoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [error, setError] = useState(null);
  const newItemInputRef = useRef(null);

  // Debug logging
  console.log("TodoList screen rendered");
  console.log("Route params:", route.params);
  console.log("Current user:", auth.currentUser?.uid);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={startAddingNew} style={styles.headerButton}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    const listId = route.params?.listid;
    
    console.log("Firestore setup - User:", user?.uid, "List ID:", listId);
    
    if (!user || !listId) {
      console.log("Missing user or listId - User:", !!user, "ListId:", listId);
      setLoading(false);
      setError("Missing user authentication or list ID");
      return;
    }

    try {
      // Correct Firestore path: users/{userId}/lists/{listId}/todos
      const todoRef = collection(db, "users", user.uid, "lists", listId, "todos");
      console.log("Firestore path:", `users/${user.uid}/lists/${listId}/todos`);
      
      const q = query(todoRef, orderBy("createdAt", "asc"));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log("Firestore snapshot received, count:", snapshot.size);
          const itemsData = [];
          snapshot.forEach((doc) => {
            itemsData.push({ id: doc.id, ...doc.data() });
          });
          setTodoItems(itemsData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Firestore error:", error);
          setError("Error loading todos: " + error.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Setup error:", error);
      setError("Setup error: " + error.message);
      setLoading(false);
    }
  }, [route.params?.listid]);

  // Focus on new item input when adding starts
  useEffect(() => {
    if (isAddingNew) {
      setTimeout(() => {
        newItemInputRef.current?.focus();
      }, 100);
    }
  }, [isAddingNew]);

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
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
    const wordCount = countWords(newTodoText);
    if (!newTodoText.trim() || wordCount > 30) return;

    const user = auth.currentUser;
    const listId = route.params?.listid;
    
    if (!user || !listId) {
      setError("Cannot add todo - missing authentication");
      return;
    }

    try {
      const todoRef = collection(db, "users", user.uid, "lists", listId, "todos");
      await addDoc(todoRef, {
        text: newTodoText.trim(),
        isChecked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsAddingNew(false);
      setNewTodoText('');
      setError(null);
    } catch (error) {
      console.error("Error adding todo:", error);
      setError("Failed to add todo: " + error.message);
    }
  };

  const toggleItemChecked = async (item) => {
    const user = auth.currentUser;
    const listId = route.params?.listid;
    
    if (!user || !listId) return;

    try {
      const todoDocRef = doc(db, "users", user.uid, "lists", listId, "todos", item.id);
      await updateDoc(todoDocRef, {
        isChecked: !item.isChecked,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      setError("Failed to update todo: " + error.message);
    }
  };

  const updateItemText = async (item, newText) => {
    const wordCount = countWords(newText);
    if (wordCount > 30) return;

    const user = auth.currentUser;
    const listId = route.params?.listid;
    
    if (!user || !listId) return;

    try {
      const todoDocRef = doc(db, "users", user.uid, "lists", listId, "todos", item.id);
      await updateDoc(todoDocRef, {
        text: newText.trim(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating todo text:", error);
      setError("Failed to update todo: " + error.message);
    }
  };

  const deleteItem = async (item) => {
    const user = auth.currentUser;
    const listId = route.params?.listid;
    
    if (!user || !listId) return;

    try {
      const todoDocRef = doc(db, "users", user.uid, "lists", listId, "todos", item.id);
      await deleteDoc(todoDocRef);
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError("Failed to delete todo: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.red} />
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              style={[
                styles.newTodoInput,
                countWords(newTodoText) > 30 && styles.inputError
              ]}
              placeholder="What needs to be done? (Max 30 words)"
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
              <Text style={[
                styles.wordCount,
                countWords(newTodoText) > 30 && styles.wordCountError
              ]}>
                {countWords(newTodoText)}/30 words
              </Text>
              
              <View style={styles.newTodoButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelAddingNew}
                >
                  <Ionicons name="close" size={20} color={Colors.red} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.saveButton,
                    (!newTodoText.trim() || countWords(newTodoText) > 30) && styles.saveButtonDisabled
                  ]}
                  onPress={addNewTodo}
                  disabled={!newTodoText.trim() || countWords(newTodoText) > 30}
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
              onToggle={() => toggleItemChecked(item)}
              onTextChange={(newText) => updateItemText(item, newText)}
              onDelete={() => deleteItem(item)}
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

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);

  const handleSave = () => {
    const wordCount = countWords(editText);
    if (editText.trim() && editText !== item.text && wordCount <= 30) {
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
                style={[
                  styles.editInput,
                  countWords(editText) > 30 && styles.inputError
                ]}
                value={editText}
                onChangeText={setEditText}
                onBlur={handleSave}
                onSubmitEditing={handleSave}
                autoFocus
                multiline
                textAlignVertical="top"
                blurOnSubmit={true}
              />
              <Text style={styles.editWordCount}>
                {countWords(editText)}/30 words
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: Colors.white,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.red,
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ... rest of your styles remain the same
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
  },
  wordCount: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  wordCountError: {
    color: Colors.red,
    fontWeight: 'bold',
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
  inputError: {
    borderColor: Colors.red,
    backgroundColor: '#FFF5F5',
  },
  editWordCount: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
});