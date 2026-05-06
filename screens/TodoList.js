import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";

import Colors, { lightTheme, darkTheme } from "../Constants/Colors";
import { useAuth } from "../context/AuthContext";

const TODOS_STORAGE_KEY_BASE = "@todos_offline_data";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TodoList({ navigation, route }) {
  const { isDarkMode, user } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { listid, color: initialColor, title: navTitle } = route.params || {};
  const [currentColor, setCurrentColor] = useState(initialColor || Colors.blue);
  const [listTitle, setListTitle] = useState(navTitle || "New Task List");
  const [todoItems, setTodoItems] = useState([]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [taskDate, setTaskDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const firedTasksRef = useRef(new Set());

  const getStorageKey = () =>
    `${TODOS_STORAGE_KEY_BASE}_${user?.uid || "guest"}`;

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("precise-alarms", {
          name: "Precise Alarms",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          enableVibrate: true,
          bypassDnd: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    })();
  }, []);

  useEffect(() => {
    const buzzer = setInterval(() => {
      const now = new Date();
      const currentTimeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      todoItems.forEach(async (item) => {
        if (item.isChecked) return;

        const taskTime = new Date(item.scheduledTime);
        const taskTimeString = taskTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        if (
          currentTimeString === taskTimeString &&
          !firedTasksRef.current.has(item.id)
        ) {
          firedTasksRef.current.add(item.id);

          await Notifications.presentNotificationAsync({
            title: "🚨 URGENT: " + item.text,
            body: "Task starting now!",
            android: {
              channelId: "precise-alarms",
              priority: "max",
            },
          });
        }
      });
    }, 1000);

    return () => clearInterval(buzzer);
  }, [todoItems]);

  const scheduleTaskNotification = async (task) => {
    const triggerDate = new Date(task.scheduledTime);
    const now = Date.now();

    if (triggerDate.getTime() <= now + 5000) {
      return null;
    }

    const alarmCategory = Notifications.AndroidNotificationCategory
      ? Notifications.AndroidNotificationCategory.ALARM
      : "alarm";

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ " + task.text,
        body: "Scheduled Task Reminder",
        data: { listid, taskId: task.id },
        android: {
          channelId: "precise-alarms",
          priority: "max",
          importance: Notifications.AndroidImportance.MAX,
          category: alarmCategory,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        allowWhileIdle: true,
      },
    });
  };

  const saveTask = async () => {
    if (!newTodoText.trim()) return;

    const preciseTrigger = new Date(taskDate);
    preciseTrigger.setSeconds(0);
    preciseTrigger.setMilliseconds(0);

    const now = new Date();
    if (preciseTrigger.getTime() <= now.getTime()) {
      preciseTrigger.setMinutes(preciseTrigger.getMinutes() + 1);
    }

    const taskData = {
      text: newTodoText,
      scheduledTime: preciseTrigger.toISOString(),
    };

    try {
      const notifId = await scheduleTaskNotification({
        ...taskData,
        id: editingTaskId || Date.now().toString(),
      });

      let updated;
      const finalTitle =
        listTitle === "New Task List" ? newTodoText : listTitle;

      if (editingTaskId) {
        updated = todoItems.map((t) =>
          t.id === editingTaskId
            ? { ...t, ...taskData, notificationId: notifId }
            : t,
        );
      } else {
        const newTodo = {
          id: Date.now().toString(),
          ...taskData,
          isChecked: false,
          notificationId: notifId,
        };
        updated = [newTodo, ...todoItems];
      }

      await syncData(updated, currentColor, finalTitle);
      resetInput();
    } catch (error) {
      console.error("Save Error:", error);
    }
  };

  const syncData = async (
    updatedTasks,
    newColor = currentColor,
    newTitle = listTitle,
  ) => {
    if (!listid || !user) return;
    setTodoItems(updatedTasks);
    setListTitle(newTitle);
    try {
      const STORAGE_KEY = getStorageKey();
      const localData = await AsyncStorage.getItem(STORAGE_KEY);
      const allLists = localData ? JSON.parse(localData) : {};
      allLists[listid.toString()] = {
        ...allLists[listid.toString()],
        tasks: updatedTasks,
        title: newTitle,
        color: newColor,
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allLists));
    } catch (e) {
      console.error(e);
    }
  };

  const loadListData = async () => {
    if (!listid || !user) return;
    const localData = await AsyncStorage.getItem(getStorageKey());
    if (localData) {
      const allLists = JSON.parse(localData);
      const data = allLists[listid.toString()];
      if (data) {
        setTodoItems(data.tasks || []);
        setListTitle(data.title || navTitle);
        setCurrentColor(data.color || initialColor);
      }
    }
  };

  useEffect(() => {
    loadListData();
  }, [listid, user]);

  const resetInput = () => {
    setNewTodoText("");
    setIsAddingNew(false);
    setEditingTaskId(null);
    setTaskDate(new Date());
    Keyboard.dismiss();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: listTitle,
      headerStyle: { backgroundColor: currentColor },
      headerTintColor: "#fff",
    });
  }, [navigation, listTitle, currentColor]);

  const totalCount = todoItems.length;
  const completedCount = todoItems.filter((t) => t.isChecked).length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // Increased offset to push it higher when keyboard is active
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor={currentColor} />

          <View
            style={[styles.progressCard, { backgroundColor: currentColor }]}
          >
            <View style={styles.progressInfo}>
              <View>
                <Text style={styles.progressTitle}>Daily Progress</Text>
                <Text style={styles.progressSub}>
                  {completedCount} of {totalCount} completed
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

          <FlatList
            data={todoItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View
                style={[styles.todoRow, { backgroundColor: theme.surface }]}
              >
                <TouchableOpacity
                  onPress={() =>
                    syncData(
                      todoItems.map((t) =>
                        t.id === item.id
                          ? { ...t, isChecked: !t.isChecked }
                          : t,
                      ),
                    )
                  }
                >
                  <Ionicons
                    name={
                      item.isChecked ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={28}
                    color={
                      item.isChecked ? Colors.success : theme.textSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.todoTextContainer}
                  onPress={() => {
                    setEditingTaskId(item.id);
                    setNewTodoText(item.text);
                    setTaskDate(new Date(item.scheduledTime));
                    setIsAddingNew(true);
                  }}
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
                  <Text
                    style={[styles.timeLabel, { color: theme.textSecondary }]}
                  >
                    <Ionicons name="time-outline" size={12} />{" "}
                    {new Date(item.scheduledTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (item.notificationId)
                      Notifications.cancelScheduledNotificationAsync(
                        item.notificationId,
                      );
                    syncData(todoItems.filter((t) => t.id !== item.id));
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            )}
          />

          {isAddingNew ? (
            <SafeAreaView style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
              <View style={styles.inputArea}>
                <TextInput
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
                    <Text style={{ color: Colors.error, fontWeight: "600" }}>Cancel</Text>
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
            </SafeAreaView>
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
              onChange={(e, d) => {
                setShowPicker(false);
                if (d) setTaskDate(d);
              }}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  listContent: { padding: 20, paddingBottom: 180 }, 
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
  inputWrapper: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 25,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  listContent: { 
    padding: 20, 
    paddingBottom: 220 // Increased to ensure the list scrolls past the higher input area
  },
  inputArea: {
    padding: 20,
    // Increased bottom padding to lift the modal higher
    paddingBottom: Platform.OS === 'android' ? 80 : 60,
  },
  inputLarge: { fontSize: 18, minHeight: 50 },
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
    bottom: 95,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});