// screens/Calendar.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../Constants/Colors';
import { auth, db } from './firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  where 
} from 'firebase/firestore';

// Configure notifications with sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Calendar = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState(null);

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(new Date().setHours(new Date().getHours() + 1)),
  });

  useEffect(() => {
    console.log('Calendar component mounted');
    loadReminders();
    requestNotificationPermissions();
    setupNotificationListener();
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('Notification permission status:', newStatus);
      } else {
        console.log('Notification permission already granted');
      }
      
      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: true,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('Android notification channel configured');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  const setupNotificationListener = () => {
    // Listener for when notifications are received while app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when notifications are tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Navigate to calendar when notification is tapped
      navigation.navigate('Calendar');
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  };

  const scheduleNotification = async (reminder) => {
    try {
      console.log('Scheduling notification for reminder:', reminder.id);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Reminder: ' + reminder.title,
          body: reminder.description || 'Time for your reminder!',
          sound: 'default',
          data: { 
            reminderId: reminder.id,
            type: 'reminder'
          },
          priority: 'high',
        },
        trigger: {
          date: reminder.date,
          channelId: Platform.OS === 'android' ? 'reminders' : undefined,
        },
      });
      
      console.log('Notification scheduled successfully with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  const cancelNotification = async (reminderId) => {
    try {
      console.log('Cancelling notification for reminder:', reminderId);
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.reminderId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log('Cancelled notification:', notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const loadReminders = () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      setReminders([]);
      setRemindersLoading(false);
      setRemindersError('No user logged in');
      return () => {};
    }

    console.log('Loading reminders for user:', user.uid);
    setRemindersLoading(true);
    setRemindersError(null);

    const remindersRef = collection(db, 'users', user.uid, 'reminders');
    const remindersQuery = query(remindersRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(remindersQuery, 
      (snapshot) => {
        console.log('Firestore snapshot received, document count:', snapshot.size);
        
        const remindersData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Reminder document:', doc.id, data);
          
          // Convert Firestore timestamps to Date objects
          const reminderDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          
          remindersData.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            date: reminderDate,
            createdAt: createdAt,
            notificationId: data.notificationId,
          });
        });
        
        console.log('Processed reminders count:', remindersData.length);
        setReminders(remindersData);
        setRemindersLoading(false);
        setRemindersError(null);
      },
      (error) => {
        console.error('Error loading reminders:', error);
        setRemindersError(error.message);
        setRemindersLoading(false);
        Alert.alert('Error', `Failed to load reminders: ${error.message}`);
      }
    );

    return unsubscribe;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      // Preserve the time from existing reminder
      newDate.setHours(newReminder.time.getHours());
      newDate.setMinutes(newReminder.time.getMinutes());
      setNewReminder({...newReminder, date: newDate});
      console.log('Date changed to:', newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    
    if (selectedTime) {
      const newTime = new Date(selectedTime);
      // Preserve the date from existing reminder
      const updatedDate = new Date(newReminder.date);
      updatedDate.setHours(newTime.getHours());
      updatedDate.setMinutes(newTime.getMinutes());
      setNewReminder({...newReminder, time: newTime, date: updatedDate});
      console.log('Time changed to:', newTime);
    }
  };

  const resetReminderForm = () => {
    setNewReminder({
      title: '',
      description: '',
      date: new Date(),
      time: new Date(new Date().setHours(new Date().getHours() + 1)),
    });
    setEditingReminder(null);
  };

  const openAddReminderModal = () => {
    resetReminderForm();
    const defaultDate = new Date(selectedDate);
    defaultDate.setHours(12, 0, 0, 0); // Set to noon by default
    
    setNewReminder({
      title: '',
      description: '',
      date: defaultDate,
      time: defaultDate,
    });
    setShowReminderModal(true);
    console.log('Opened add reminder modal');
  };

  const openEditReminderModal = (reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      title: reminder.title,
      description: reminder.description || '',
      date: reminder.date,
      time: reminder.date,
    });
    setShowReminderModal(true);
    console.log('Opened edit reminder modal for:', reminder.id);
  };

  const saveReminder = async () => {
    if (isLoading) return;

    // Validate input
    if (!newReminder.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save reminders');
      return;
    }

    console.log('Saving reminder...');
    console.log('User:', user.uid);
    console.log('Reminder data:', newReminder);

    setIsLoading(true);

    try {
      // Combine date and time into a single datetime
      const reminderDateTime = new Date(
        newReminder.date.getFullYear(),
        newReminder.date.getMonth(),
        newReminder.date.getDate(),
        newReminder.time.getHours(),
        newReminder.time.getMinutes(),
        0,
        0
      );

      console.log('Combined datetime:', reminderDateTime);

      // Validate future date
      if (reminderDateTime < new Date()) {
        Alert.alert('Error', 'Please select a future date and time');
        setIsLoading(false);
        return;
      }

      const remindersRef = collection(db, 'users', user.uid, 'reminders');
      
      const reminderData = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim(),
        date: reminderDateTime, // Firestore will convert this to Timestamp
        updatedAt: new Date(),
      };

      let reminderId;
      let notificationId;

      if (editingReminder) {
        // Update existing reminder
        console.log('Updating existing reminder:', editingReminder.id);
        reminderData.createdAt = editingReminder.createdAt;
        
        const reminderRef = doc(db, 'users', user.uid, 'reminders', editingReminder.id);
        await updateDoc(reminderRef, reminderData);
        reminderId = editingReminder.id;
        
        // Cancel old notification and schedule new one
        await cancelNotification(editingReminder.id);
        notificationId = await scheduleNotification({
          id: editingReminder.id,
          ...reminderData
        });
      } else {
        // Create new reminder
        console.log('Creating new reminder');
        reminderData.createdAt = new Date();
        
        const docRef = await addDoc(remindersRef, reminderData);
        reminderId = docRef.id;
        console.log('New reminder created with ID:', reminderId);
        
        // Schedule notification
        notificationId = await scheduleNotification({
          id: reminderId,
          ...reminderData
        });
      }

      // Store notification ID in Firestore for reference
      if (notificationId) {
        const reminderRef = doc(db, 'users', user.uid, 'reminders', reminderId);
        await updateDoc(reminderRef, { 
          notificationId: notificationId,
          updatedAt: new Date()
        });
        console.log('Notification ID stored in Firestore:', notificationId);
      }

      // Success - reset and close
      resetReminderForm();
      setShowReminderModal(false);
      
      Alert.alert(
        'Success', 
        editingReminder ? 'Reminder updated successfully!' : 'Reminder added successfully! You will receive a notification at the scheduled time.'
      );
      
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', `Failed to save reminder: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReminder = async (reminderId) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting reminder:', reminderId);
              
              // Cancel the notification first
              await cancelNotification(reminderId);
              
              // Delete from Firestore
              const reminderRef = doc(db, 'users', user.uid, 'reminders', reminderId);
              await deleteDoc(reminderRef);
              
              console.log('Reminder deleted successfully');
              Alert.alert('Success', 'Reminder deleted successfully!');
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          }
        }
      ]
    );
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty days for padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getRemindersForDate = (date) => {
    if (!date) return [];
    
    return reminders.filter(reminder => {
      const reminderDate = reminder.date;
      return (
        reminderDate.getDate() === date.getDate() &&
        reminderDate.getMonth() === date.getMonth() &&
        reminderDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const renderCalendarItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        item && getRemindersForDate(item).length > 0 && styles.dayWithReminders,
        item && isToday(item) && styles.today,
        item && 
        item.getDate() === selectedDate.getDate() &&
        item.getMonth() === selectedDate.getMonth() &&
        item.getFullYear() === selectedDate.getFullYear() && 
        styles.selectedDay,
      ]}
      onPress={() => handleDateSelect(item)}
      disabled={!item}
    >
      {item && (
        <>
          <Text
            style={[
              styles.dayText,
              item && isToday(item) && styles.todayText,
              item.getDate() === selectedDate.getDate() &&
              item.getMonth() === selectedDate.getMonth() &&
              item.getFullYear() === selectedDate.getFullYear() && 
              styles.selectedDayText,
            ]}
          >
            {item.getDate()}
          </Text>
          {getRemindersForDate(item).length > 0 && (
            <View style={styles.reminderIndicator}>
              <Text style={styles.reminderCount}>
                {getRemindersForDate(item).length}
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );

  const renderReminderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.reminderCard,
        item.date < new Date() && styles.pastReminderCard
      ]}
      onPress={() => openEditReminderModal(item)}
      onLongPress={() => deleteReminder(item.id)}
    >
      <View style={styles.reminderContent}>
        <View style={styles.reminderHeader}>
          <Ionicons 
            name="notifications" 
            size={20} 
            color={item.date < new Date() ? Colors.gray : Colors.blue} 
          />
          <Text style={[
            styles.reminderTitle,
            item.date < new Date() && styles.pastReminderText
          ]}>
            {item.title}
          </Text>
        </View>
        
        {item.description ? (
          <Text style={[
            styles.reminderDescription,
            item.date < new Date() && styles.pastReminderText
          ]}>
            {item.description}
          </Text>
        ) : null}
        
        <View style={styles.reminderFooter}>
          <Text style={[
            styles.reminderDateTime,
            item.date < new Date() && styles.pastReminderText
          ]}>
            {formatDateTime(item.date)}
          </Text>
          {item.date < new Date() && (
            <Text style={styles.pastLabel}>Past</Text>
          )}
        </View>
      </View>
      
      <View style={styles.reminderActions}>
        <TouchableOpacity 
          onPress={() => openEditReminderModal(item)}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={18} color={Colors.blue} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteReminder(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.red} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const days = getDaysInMonth(currentDate);
  const selectedDateReminders = getRemindersForDate(selectedDate);

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity 
          onPress={() => navigateMonth(-1)}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity 
          onPress={() => navigateMonth(1)}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.blue} />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.dayHeaderText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <FlatList
          data={days}
          renderItem={renderCalendarItem}
          numColumns={7}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </View>

      {/* Add Reminder Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={openAddReminderModal}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Reminder</Text>
      </TouchableOpacity>

      {/* Selected Date Reminders */}
      <View style={styles.selectedDateSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.selectedDateTitle}>
            {formatDate(selectedDate)}
          </Text>
          <Text style={styles.remindersCount}>
            {selectedDateReminders.length} reminder{selectedDateReminders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {remindersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.blue} />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : remindersError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={Colors.red} />
            <Text style={styles.errorText}>Error loading reminders</Text>
            <Text style={styles.errorSubtext}>{remindersError}</Text>
          </View>
        ) : selectedDateReminders.length === 0 ? (
          <View style={styles.noRemindersContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.lightGray} />
            <Text style={styles.noRemindersText}>No reminders for this date</Text>
            <Text style={styles.noRemindersSubtext}>Tap "Add Reminder" to schedule one</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDateReminders}
            renderItem={renderReminderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.remindersList}
          />
        )}
      </View>

      {/* Add/Edit Reminder Modal */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isLoading && setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                </Text>
                <TouchableOpacity 
                  onPress={() => !isLoading && setShowReminderModal(false)}
                  style={styles.closeButton}
                  disabled={isLoading}
                >
                  <Ionicons name="close" size={24} color={isLoading ? Colors.lightGray : Colors.black} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reminder title..."
                  value={newReminder.title}
                  onChangeText={(text) => setNewReminder({...newReminder, title: text})}
                  maxLength={100}
                  editable={!isLoading}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Enter description (optional)..."
                  value={newReminder.description}
                  onChangeText={(text) => setNewReminder({...newReminder, description: text})}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  editable={!isLoading}
                />

                <Text style={styles.inputLabel}>Date and Time</Text>
                
                <TouchableOpacity 
                  style={[styles.datetimeButton, isLoading && styles.disabledButton]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="calendar" size={20} color={isLoading ? Colors.lightGray : Colors.blue} />
                  <Text style={[styles.datetimeText, isLoading && styles.disabledText]}>
                    {newReminder.date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.datetimeButton, isLoading && styles.disabledButton]}
                  onPress={() => setShowTimePicker(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="time" size={20} color={isLoading ? Colors.lightGray : Colors.blue} />
                  <Text style={[styles.datetimeText, isLoading && styles.disabledText]}>
                    {formatTime(newReminder.time)}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.previewText}>
                  Reminder will be set for: {"\n"}
                  <Text style={styles.previewDateTime}>
                    {formatDateTime(new Date(
                      newReminder.date.getFullYear(),
                      newReminder.date.getMonth(),
                      newReminder.date.getDate(),
                      newReminder.time.getHours(),
                      newReminder.time.getMinutes()
                    ))}
                  </Text>
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, isLoading && styles.disabledButton]}
                  onPress={() => !isLoading && setShowReminderModal(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.cancelButtonText, isLoading && styles.disabledText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.saveButton, 
                    (!newReminder.title.trim() || isLoading) && styles.saveButtonDisabled
                  ]}
                  onPress={saveReminder}
                  disabled={!newReminder.title.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={newReminder.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={newReminder.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    padding: 10,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  daysHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    maxHeight: 300,
    paddingHorizontal: 10,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e9ecef',
    margin: 1,
  },
  dayWithReminders: {
    backgroundColor: '#fff3cd',
  },
  today: {
    backgroundColor: '#e3f2fd',
    borderColor: Colors.blue,
    borderWidth: 2,
  },
  selectedDay: {
    backgroundColor: Colors.blue,
  },
  dayText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: 'bold',
    color: Colors.blue,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reminderIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.blue,
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectedDateSection: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  remindersCount: {
    fontSize: 14,
    color: Colors.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.blue,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.red,
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
    textAlign: 'center',
  },
  noRemindersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noRemindersText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginTop: 10,
  },
  noRemindersSubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 5,
  },
  remindersList: {
    flex: 1,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastReminderCard: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginLeft: 8,
    flex: 1,
  },
  reminderDescription: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 8,
    lineHeight: 18,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderDateTime: {
    fontSize: 12,
    color: Colors.blue,
    fontWeight: '600',
  },
  pastReminderText: {
    color: Colors.gray,
  },
  pastLabel: {
    fontSize: 10,
    color: Colors.red,
    fontWeight: 'bold',
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datetimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  datetimeText: {
    fontSize: 16,
    color: Colors.black,
    marginLeft: 8,
  },
  previewText: {
    fontSize: 14,
    color: Colors.darkGray,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    lineHeight: 20,
  },
  previewDateTime: {
    fontWeight: 'bold',
    color: Colors.blue,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: Colors.blue,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.lightGray,
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.lightGray,
  },
});