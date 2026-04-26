import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

// Correct Imports
import Colors, { lightTheme, darkTheme } from "../Constants/Colors";
import { useAuth } from "../context/AuthContext";
import ColorSelector from "../components/ColorSelector";

const TODOS_STORAGE_KEY = "@todos_offline_data";

export default function TodoList({ navigation, route }) {
  // 1. THEME & AUTH (Defined first to prevent ReferenceError)
  const { isDarkMode, user, isOnline } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // 2. PARAMS & STATE
  const { listid, color: initialColor, title: navTitle } = route.params || {};
  const [currentColor, setCurrentColor] = useState(initialColor || Colors.blue);
  const [listTitle, setListTitle] = useState(navTitle || "New Task List");
  const [todoItems, setTodoItems] = useState([]);

  // Input & Modal States
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [taskDate, setTaskDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [editingTaskId, setEditingTaskId] = useState(null);

  // 3. REFS & ANIMATION
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const newItemInputRef = useRef(null);

  // Color options for the selector
  const colorOptions = ["blue", "red", "green", "orange", "purple", "teal"];

  // 4. SYNC & PERSISTENCE
  const syncData = async (updatedTasks, newColor = currentColor) => {
    if (!listid) return;

    // TITLE UPDATE LOGIC:
    let finalTitle = listTitle;
    if (
      (listTitle === "New Task List" || !listTitle) &&
      updatedTasks.length > 0
    ) {
      // Use the text of the first task as the new list title
      finalTitle = updatedTasks[0].text;
      setListTitle(finalTitle);
    }

    setTodoItems(updatedTasks);

    try {
      const timestamp = new Date().toISOString();
      const safeListId = listid.toString();

      const localTasksData = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      const allTasks = localTasksData ? JSON.parse(localTasksData) : {};

      allTasks[safeListId] = {
        ...allTasks[safeListId],
        tasks: updatedTasks,
        title: finalTitle, // Save the updated title
        color: newColor,
        updated_at: timestamp,
        created_at: allTasks[safeListId]?.created_at || timestamp,
      };
      await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(allTasks));

      // Update the Home Screen Index so it shows the new title immediately
      const globalIndexData = await AsyncStorage.getItem("@todo_lists_cache");
      let todoListsIndex = globalIndexData ? JSON.parse(globalIndexData) : [];
      const existingIndex = todoListsIndex.findIndex(
        (item) => item.id === safeListId,
      );

      const listSummary = {
        id: safeListId,
        title: finalTitle, // Match the new title
        color: newColor,
        updated_at: timestamp,
        type: "todo",
      };

      if (existingIndex > -1) todoListsIndex[existingIndex] = listSummary;
      else todoListsIndex.unshift(listSummary);

      await AsyncStorage.setItem(
        "@todo_lists_cache",
        JSON.stringify(todoListsIndex),
      );
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
  const loadListData = async () => {
    if (!listid) return;
    
    try {
      const safeListId = listid.toString();
      const localData = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      
      if (localData) {
        const allTasks = JSON.parse(localData);
        const currentListData = allTasks[safeListId];

        if (currentListData) {
          // Update tasks
          setTodoItems(currentListData.tasks || []);
          
          // Update title if it exists in storage
          if (currentListData.title) {
            setListTitle(currentListData.title);
          }
          
          // Update color if it exists in storage
          if (currentListData.color) {
            setCurrentColor(currentListData.color);
          }
        }
      }
    } catch (error) {
      console.error("Error loading todo list:", error);
    }
  };

  loadListData();
}, [listid]); // Runs once when listid is available
  // 5. TASK ACTIONS
  const saveTask = () => {
    if (!newTodoText.trim()) return;

    let updated;
    if (editingTaskId) {
      updated = todoItems.map((t) =>
        t.id === editingTaskId
          ? { ...t, text: newTodoText, scheduledTime: taskDate.toISOString() }
          : t,
      );
    } else {
      const newTodo = {
        id: Date.now().toString(),
        text: newTodoText,
        isChecked: false,
        scheduledTime: taskDate.toISOString(),
      };
      updated = [newTodo, ...todoItems];
    }

    syncData(updated);
    resetInput();
  };

  const resetInput = () => {
    setNewTodoText("");
    setIsAddingNew(false);
    setEditingTaskId(null);
    setTaskDate(new Date());
    Keyboard.dismiss();
  };

  const startEditing = (item) => {
    setEditingTaskId(item.id);
    setNewTodoText(item.text);
    setTaskDate(new Date(item.scheduledTime));
    setIsAddingNew(true);
  };

  // 6. UI HELPERS
  const totalCount = todoItems.length;
  const completedCount = todoItems.filter((t) => t.isChecked).length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: listTitle,
      headerStyle: { backgroundColor: currentColor, elevation: 0 },
      headerTintColor: "#fff",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowColorPicker(!showColorPicker)}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="color-palette" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, listTitle, currentColor, showColorPicker]);

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setTaskDate(selectedDate);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, backgroundColor: theme.background },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={currentColor} />

      {showColorPicker && (
        <View style={{ backgroundColor: theme.surface, paddingBottom: 10 }}>
          <ColorSelector
            selectedColor={currentColor}
            colorOptions={colorOptions}
            onSelect={(color) => {
              setCurrentColor(color);
              setShowColorPicker(false);
              syncData(todoItems, color);
            }}
          />
        </View>
      )}

      {/* Progress Header */}
      <View style={[styles.progressCard, { backgroundColor: currentColor }]}>
        <View style={styles.progressInfo}>
          <View>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.progressSub}>
              {completedCount} of {totalCount} tasks completed
            </Text>
          </View>
          <View style={styles.percentageCircle}>
            <Text style={styles.percentageText}>{progressPercentage}%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={todoItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.todoRow, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              onPress={() =>
                syncData(
                  todoItems.map((t) =>
                    t.id === item.id ? { ...t, isChecked: !t.isChecked } : t,
                  ),
                )
              }
            >
              <Ionicons
                name={item.isChecked ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={item.isChecked ? Colors.success : theme.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.todoTextContainer}
              onPress={() => startEditing(item)}
            >
              <Text
                style={[
                  styles.todoText,
                  { color: theme.text },
                  item.isChecked && styles.todoTextDone,
                ]}
              >
                {item.text}
              </Text>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
                <Ionicons name="time-outline" size={12} />{" "}
                {new Date(item.scheduledTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                syncData(todoItems.filter((t) => t.id !== item.id))
              }
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* FAB or Input Area */}
      {isAddingNew ? (
        <View style={[styles.inputArea, { backgroundColor: theme.surface }]}>
          <TextInput
            ref={newItemInputRef}
            style={[styles.inputLarge, { color: theme.text }]}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.textSecondary}
            value={newTodoText}
            onChangeText={setNewTodoText}
            autoFocus
          />
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => {
                setPickerMode("date");
                setShowPicker(true);
              }}
            >
              <Ionicons name="calendar" size={18} color={currentColor} />
              <Text style={[styles.selectorText, { color: theme.text }]}>
                {taskDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => {
                setPickerMode("time");
                setShowPicker(true);
              }}
            >
              <Ionicons name="time" size={18} color={currentColor} />
              <Text style={[styles.selectorText, { color: theme.text }]}>
                {taskDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={resetInput}>
              <Text style={{ color: Colors.error, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveTask}
              style={[styles.saveBtn, { backgroundColor: currentColor }]}
            >
              <Text style={styles.saveBtnText}>
                {editingTaskId ? "Update" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: currentColor }]}
          onPress={() => setIsAddingNew(true)}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {showPicker && (
        <DateTimePicker
          value={taskDate}
          mode={pickerMode}
          is24Hour={false}
          display="default"
          onChange={onDateChange}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressCard: {
    padding: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 10,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  progressTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  progressSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  percentageCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: { color: "white", fontWeight: "bold" },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  listContent: { padding: 20, paddingBottom: 100 },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
  },
  todoTextContainer: { flex: 1, marginLeft: 15 },
  todoText: { fontSize: 16, fontWeight: "600" },
  todoTextDone: { textDecorationLine: "line-through", opacity: 0.5 },
  timeLabel: { fontSize: 11, marginTop: 4 },
  inputArea: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 25,
  },
  inputLarge: { fontSize: 18, minHeight: 60, textAlignVertical: "top" },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  selectorBtn: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
  },
  selectorText: { marginLeft: 8, fontSize: 13, fontWeight: "600" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15 },
  saveBtnText: { color: "white", fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});
