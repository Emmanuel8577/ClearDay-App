import React, { useState, useEffect } from "react";
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
import { Audio } from "expo-av";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../Constants/Colors";

const { width, height } = Dimensions.get("window");
const dayWidth = (width - 40) / 7;

const ALARM_TONES = Array.from({ length: 10 }, (_, i) => ({
  id: `alarm_tone_${i + 1}`,
  name: `Premium Tone ${i + 1}`,
  file: `alarm_tone_${i + 1}.mp3`,
}));

export default function Calendar() {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Modal Form State
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState(new Date());
  const [selectedTune, setSelectedTune] = useState(ALARM_TONES[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    configureNotifications();
    loadReminders();
  }, []);

  const configureNotifications = async () => {
    if (Platform.OS === "android") {
      for (const tune of ALARM_TONES) {
        await Notifications.setNotificationChannelAsync(tune.id, {
          name: tune.name,
          importance: Notifications.AndroidImportance.MAX,
          sound: tune.file,
          vibrationPattern: [0, 250, 250, 250],
          enableVibration: true,
        });
      }
    }
  };

  const loadReminders = async () => {
    const data = await AsyncStorage.getItem("reminders");
    if (data) setReminders(JSON.parse(data));
  };

  // --- Logic ---
  const handleAddPress = () => {
    const defaultTime = new Date(selectedDate);
    defaultTime.setHours(new Date().getHours(), new Date().getMinutes() + 5);
    setReminderTime(defaultTime);
    setIsModalVisible(true);
  };

  const saveAlarm = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert("Missing Info", "Please give your reminder a title.");
      return;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${reminderTitle}`,
        body: "Your ClearDay reminder is starting!",
        sound: Platform.OS === "ios" ? selectedTune.file : undefined,
      },
      trigger: { date: reminderTime, channelId: selectedTune.id },
    });

    const newEntry = {
      id: identifier,
      title: reminderTitle,
      time: reminderTime.toISOString(),
      tune: selectedTune.name,
    };

    const updated = [...reminders, newEntry];
    setReminders(updated);
    await AsyncStorage.setItem("reminders", JSON.stringify(updated));

    setIsModalVisible(false);
    setReminderTitle("");
    Alert.alert("Alarm Set", "We'll notify you with high volume.");
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

  // --- Render Helpers ---
  const renderCalendarDay = (day, index) => {
    if (!day) return <View key={`empty-${index}`} style={styles.dayBox} />;
    const isSelected = selectedDate.toDateString() === day.toDateString();
    const isToday = new Date().toDateString() === day.toDateString();

    return (
      <TouchableOpacity
        key={index}
        onPress={() => setSelectedDate(day)}
        style={[styles.dayBox, isSelected && styles.selectedDayBox]}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.whiteText,
            isToday && !isSelected && styles.todayText,
          ]}
        >
          {day.getDate()}
        </Text>
        {isToday && !isSelected && <View style={styles.todayDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manage Your Day</Text>
          <Text style={styles.monthTitle}>
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
              size={32}
              color={Colors.blue || "#007AFF"}
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
              size={32}
              color={Colors.blue || "#007AFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekLabels}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Text key={d} style={styles.weekLabelText}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {getDaysInMonth(currentDate).map(renderCalendarDay)}
        </View>
      </View>

      {/* Reminders List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionHeader}>
          Schedule for {selectedDate.getDate()}
        </Text>
        <FlatList
          data={reminders.filter(
            (r) =>
              new Date(r.time).toDateString() === selectedDate.toDateString(),
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.alarmCard}>
              <View style={styles.alarmTimeBox}>
                <Text style={styles.alarmTimeText}>
                  {new Date(item.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.alarmInfo}>
                <Text style={styles.alarmTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.alarmSub}>{item.tune}</Text>
              </View>
              <Ionicons name="notifications-outline" size={20} color="#999" />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={40} color="#DDD" />
              <Text style={styles.emptyText}>No alarms set for this day</Text>
            </View>
          }
        />
      </View>

      {/* Floating Plus Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress}>
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>

      {/* NEW REMINDER MODAL */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>New Reminder</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#CCC" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Task Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Project Stand-up"
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholderTextColor="#AAA"
            />

            <Text style={styles.inputLabel}>Time & Date</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.blue || "#007AFF"}
                />
                <Text style={styles.chipText}>
                  {reminderTime.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={Colors.blue || "#007AFF"}
                />
                <Text style={styles.chipText}>
                  {reminderTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Tone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.toneScroll}
            >
              {ALARM_TONES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTune(t)}
                  style={[
                    styles.toneChip,
                    selectedTune.id === t.id && styles.activeToneChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.toneChipText,
                      selectedTune.id === t.id && styles.whiteText,
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.infoBox}>
              <Ionicons
                name="volume-high"
                size={20}
                color={Colors.blue || "#007AFF"}
              />
              <Text style={styles.infoText}>
                This alarm will play at maximum system volume.
              </Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={saveAlarm}>
              <Text style={styles.submitBtnText}>Confirm Reminder</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="date"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setReminderTime(d);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            onChange={(e, d) => {
              setShowTimePicker(false);
              if (d) {
                const combined = new Date(reminderTime);
                combined.setHours(d.getHours(), d.getMinutes());
                setReminderTime(combined);
              }
            }}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },
  monthTitle: { fontSize: 24, fontWeight: "800", color: "#1C1C1E" },
  navRow: { flexDirection: "row", gap: 10 },

  calendarContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  weekLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekLabelText: {
    width: dayWidth - 5,
    textAlign: "center",
    fontSize: 11,
    color: "#BBB",
    fontWeight: "700",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayBox: {
    width: (width - 70) / 7,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  dayText: { fontSize: 16, fontWeight: "600", color: "#444" },
  selectedDayBox: { backgroundColor: "#007AFF", borderRadius: 12 },
  todayText: { color: "#007AFF" },
  todayDot: {
    width: 4,
    height: 4,
    backgroundColor: "#007AFF",
    borderRadius: 2,
    marginTop: 2,
  },
  whiteText: { color: "#FFF" },

  listSection: { flex: 1, marginTop: 25, paddingHorizontal: 25 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1C1C1E",
  },
  alarmCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  alarmTimeBox: {
    backgroundColor: "#F2F2F7",
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  alarmTimeText: { fontWeight: "700", fontSize: 14, color: "#007AFF" },
  alarmInfo: { flex: 1 },
  alarmTitle: { fontSize: 16, fontWeight: "600", color: "#1C1C1E" },
  alarmSub: { fontSize: 12, color: "#8E8E93", marginTop: 2 },

  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#BBB", marginTop: 10, fontSize: 14 },

  fab: {
    position: "absolute",
    bottom: 40,
    right: 30,
    backgroundColor: "#007AFF",
    width: 65,
    height: 65,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#007AFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Modal Styles
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalHeading: { fontSize: 22, fontWeight: "800" },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A3A3C",
    marginBottom: 10,
    marginTop: 20,
  },
  textInput: {
    backgroundColor: "#F2F2F7",
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    color: "#1C1C1E",
  },
  dateTimeContainer: { flexDirection: "row", gap: 10 },
  dateChip: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipText: { fontSize: 14, fontWeight: "600", color: "#1C1C1E" },
  toneScroll: { flexDirection: "row", marginTop: 5 },
  toneChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeToneChip: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  toneChipText: { fontSize: 13, fontWeight: "600", color: "#8E8E93" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    gap: 10,
  },
  infoText: { fontSize: 12, color: "#007AFF", fontWeight: "600", flex: 1 },
  submitBtn: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 40,
  },
  submitBtnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
});
