import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { lightTheme, darkTheme } from "../Constants/Colors";

const { width } = Dimensions.get("window");
const ALARM_CATEGORY_ID = "alarm-actions";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const SOUND_MAP = {
  alarm_tone_1: require("../assets/sounds/alarm_tone_1.mp3"),
  alarm_tone_2: require("../assets/sounds/alarm_tone_2.mp3"),
  alarm_tone_3: require("../assets/sounds/alarm_tone_3.mp3"),
  alarm_tone_4: require("../assets/sounds/alarm_tone_4.mp3"),
  alarm_tone_5: require("../assets/sounds/alarm_tone_5.mp3"),
  alarm_tone_6: require("../assets/sounds/alarm_tone_6.mp3"),
  alarm_tone_7: require("../assets/sounds/alarm_tone_7.mp3"),
  alarm_tone_8: require("../assets/sounds/alarm_tone_8.mp3"),
  alarm_tone_9: require("../assets/sounds/alarm_tone_9.mp3"),
  alarm_tone_10: require("../assets/sounds/alarm_tone_10.mp3"),
};

const ALARM_TONES = Array.from({ length: 10 }, (_, i) => ({
  id: `tone_${i + 1}`,
  name: `Tone ${i + 1}`,
  rawName: `alarm_tone_${i + 1}`,
}));

export default function Calendar() {
  const { user, isDarkMode } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState(new Date());
  const [selectedTune, setSelectedTune] = useState(ALARM_TONES[0]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getStorageKey = () => `@reminders_${user?.uid || "guest"}`;

  useEffect(() => {
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
    };
    setupAudio();
    loadReminders();

    Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
      {
        identifier: "silence-alarm",
        buttonTitle: "🔇 Silence Alarm",
        options: { opensAppToForeground: false },
      },
    ]);

    const receivedSub = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const soundKey = notification.request.content.data?.soundName;
        if (soundKey) triggerAlarm(soundKey);
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        if (response.actionIdentifier === "silence-alarm") {
          await stopSound();
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user]);

  const loadReminders = async () => {
    const data = await AsyncStorage.getItem(getStorageKey());
    if (data) setReminders(JSON.parse(data));
  };

  const triggerAlarm = async (soundKey) => {
    await stopSound();
    try {
      const { sound } = await Audio.Sound.createAsync(SOUND_MAP[soundKey], {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.log("Alarm Trigger Error:", e);
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  const playPreview = async (tone) => {
    await stopSound();
    try {
      const { sound } = await Audio.Sound.createAsync(SOUND_MAP[tone.rawName], {
        shouldPlay: true,
        isLooping: false,
      });
      soundRef.current = sound;
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) setIsPlaying(false);
      });
    } catch (e) {
      console.log(e);
    }
  };

  const saveAlarm = async () => {
    if (!reminderTitle.trim()) return Alert.alert("Error", "Title is required");

    const now = new Date();
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(
      reminderTime.getHours(),
      reminderTime.getMinutes(),
      0,
      0,
    );

    if (scheduledDate <= now) {
      return Alert.alert(
        "Selection Error",
        "The time you selected has already passed.",
      );
    }

    await stopSound();

    // If we are editing, cancel the old notification first
    if (editingId) {
      await Notifications.cancelScheduledNotificationAsync(editingId);
    }

    // Android Channel Setup - Using '_v1' to ensure fresh channel creation
    const channelId = `${selectedTune.rawName}_v1`;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(channelId, {
        name: `Alarm ${selectedTune.name}`,
        importance: Notifications.AndroidImportance.MAX,
        sound: selectedTune.rawName,
        vibrationPattern: [0, 250, 250, 250],
        enableVibration: true,
        bypassDnd: true,
      });
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${reminderTitle}`,
        body: "Tap 'Silence Alarm' to stop the sound",
        data: { soundName: selectedTune.rawName },
        categoryIdentifier: ALARM_CATEGORY_ID,
        sound: `${selectedTune.rawName}.mp3`,
        android: { channelId: channelId },
      },
      trigger: scheduledDate,
    });

    const newEntry = {
      id: identifier,
      title: reminderTitle,
      time: scheduledDate.toISOString(),
      tune: selectedTune.name,
      tuneRaw: selectedTune.rawName,
    };

    const updated = editingId
      ? reminders.map((r) => (r.id === editingId ? newEntry : r))
      : [...reminders, newEntry];

    setReminders(updated);
    await AsyncStorage.setItem(getStorageKey(), JSON.stringify(updated));

    setIsModalVisible(false);
    setReminderTitle("");
    setEditingId(null);
  };

  const editAlarm = (item) => {
    setEditingId(item.id);
    setReminderTitle(item.title);
    setReminderTime(new Date(item.time));
    const tune =
      ALARM_TONES.find((t) => t.name === item.tune) || ALARM_TONES[0];
    setSelectedTune(tune);
    setIsModalVisible(true);
  };

  const deleteAlarm = async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await AsyncStorage.setItem(getStorageKey(), JSON.stringify(updated));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Manage Your Day
          </Text>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() - 1)),
              )
            }
          >
            <Ionicons
              name="chevron-back-circle"
              size={35}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() + 1)),
              )
            }
          >
            <Ionicons
              name="chevron-forward-circle"
              size={35}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[styles.calendarContainer, { backgroundColor: theme.surface }]}
      >
        <View style={styles.weekLabels}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Text
              key={d}
              style={[styles.weekLabelText, { color: theme.textSecondary }]}
            >
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {getDaysInMonth(currentDate).map((day, index) => {
            if (!day) return <View key={index} style={styles.dayBox} />;
            const isSelected =
              selectedDate.toDateString() === day.toDateString();
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDate(day)}
                style={[
                  styles.dayBox,
                  isSelected && {
                    backgroundColor: theme.primary,
                    borderRadius: 12,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isSelected ? "#FFF" : theme.text },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={[styles.sectionHeader, { color: theme.text }]}>
          Schedule
        </Text>
        <FlatList
          data={reminders.filter(
            (r) =>
              new Date(r.time).toDateString() === selectedDate.toDateString(),
          )}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[styles.alarmCard, { backgroundColor: theme.surface }]}
            >
              <View
                style={[
                  styles.alarmTimeBox,
                  { backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.alarmTimeText, { color: theme.primary }]}>
                  {new Date(item.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.alarmInfo}>
                <Text style={[styles.alarmTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {isPlaying && (
                  <TouchableOpacity onPress={stopSound}>
                    <Ionicons
                      name="volume-mute-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => editAlarm(item)}>
                  <Ionicons
                    name="pencil-outline"
                    size={22}
                    color={theme.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAlarm(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={35} color="white" />
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide">
        <View
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalHeading, { color: theme.text }]}>
              {editingId ? "Edit Reminder" : "Set Reminder"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                stopSound();
                setIsModalVisible(false);
                setEditingId(null);
                setReminderTitle("");
              }}
            >
              <Ionicons
                name="close-circle"
                size={32}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Task Title
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.surface, color: theme.text },
              ]}
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholder="Ex: Meeting with client"
              placeholderTextColor={theme.textSecondary}
            />

            <TouchableOpacity
              style={styles.timeTrigger}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.timeText, { color: theme.text }]}>
                Time:{" "}
                {reminderTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Select Alarm Tone
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ALARM_TONES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    setSelectedTune(t);
                    playPreview(t);
                  }}
                  style={[
                    styles.toneChip,
                    { backgroundColor: theme.surface },
                    selectedTune.id === t.id && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedTune.id === t.id ? "#FFF" : theme.text,
                    }}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={saveAlarm}
            >
              <Text style={styles.submitBtnText}>
                {editingId ? "Update Reminder" : "Save Reminder"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          onChange={(e, d) => {
            setShowTimePicker(false);
            if (d) setReminderTime(d);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 14 },
  monthTitle: { fontSize: 24, fontWeight: "800" },
  navRow: { flexDirection: "row", gap: 10 },
  calendarContainer: {
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    elevation: 3,
  },
  weekLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  weekLabelText: {
    width: (width - 80) / 7,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayBox: {
    width: (width - 80) / 7,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: 16, fontWeight: "700" },
  listSection: { flex: 1, marginTop: 25, paddingHorizontal: 25 },
  sectionHeader: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  alarmCard: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  alarmTimeBox: { padding: 10, borderRadius: 12, marginRight: 15 },
  alarmTimeText: { fontWeight: "800", fontSize: 14 },
  alarmInfo: { flex: 1 },
  alarmTitle: { fontSize: 16, fontWeight: "700" },
  fabContainer: { position: "absolute", bottom: 40, right: 30 },
  fab: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  modalContent: { flex: 1, padding: 30 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalHeading: { fontSize: 24, fontWeight: "800" },
  inputLabel: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 25,
  },
  textInput: { padding: 20, borderRadius: 18, fontSize: 16 },
  timeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  timeText: { marginLeft: 10, fontSize: 16, fontWeight: "600" },
  toneChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
  },
  submitBtn: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 40,
  },
  submitBtnText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
});
