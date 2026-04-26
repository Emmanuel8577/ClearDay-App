import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { lightTheme, darkTheme } from "../Constants/Colors";
import AddModal from "../components/AddModal";

const { width } = Dimensions.get("window");

// Ensure these match your Note/Todo components EXACTLY
const NOTES_CACHE_PREFIX = "@notes_offline_data_";
const TODO_CACHE_KEY = "@todo_lists_cache";
const TODOS_STORAGE_KEY = "@todos_offline_data"; // The actual data storage

export default function Home({ navigation }) {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { user, isDarkMode, toggleTheme } = useAuth();

  const theme = isDarkMode ? darkTheme : lightTheme;

  const loadAllData = async () => {
  setRefreshing(true);
  try {
    // 1. Try to get the Index
    const indexData = await AsyncStorage.getItem("@todo_lists_cache");
    let combinedItems = indexData ? JSON.parse(indexData) : [];

    // 2. BACKUP: Scan all keys to find "hidden" notes
    const allKeys = await AsyncStorage.getAllKeys();
    const noteKeys = allKeys.filter(key => key.startsWith("@notes_offline_data_"));
    
    if (noteKeys.length > 0) {
      const noteData = await AsyncStorage.multiGet(noteKeys);
      const parsedNotes = noteData
        .map(([_, v]) => v ? { ...JSON.parse(v), type: "note" } : null)
        .filter(n => n && n.id);

      // Merge notes into the index if they are missing
      const existingIds = new Set(combinedItems.map(i => i.id));
      parsedNotes.forEach(note => {
        if (!existingIds.has(note.id)) {
          combinedItems.push(note);
        }
      });
    }

    // 3. Sort and Set State
    const finalItems = combinedItems
      .filter(item => item && item.id)
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    setItems(finalItems);
  } catch (e) {
    console.error("Home Load Error:", e);
  } finally {
    setRefreshing(false);
  }
};
  const deleteItem = async (item) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete this ${item.type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.type === "note") {
                // Delete specific note file
                await AsyncStorage.removeItem(
                  `${NOTES_CACHE_PREFIX}${item.id}`,
                );
              } else {
                // 1. Remove from Todo Index
                const todoData = await AsyncStorage.getItem(TODO_CACHE_KEY);
                let todos = todoData ? JSON.parse(todoData) : [];
                todos = todos.filter((t) => t.id !== item.id);
                await AsyncStorage.setItem(
                  TODO_CACHE_KEY,
                  JSON.stringify(todos),
                );

                // 2. Remove actual task data
                const fullTodoData =
                  await AsyncStorage.getItem(TODOS_STORAGE_KEY);
                if (fullTodoData) {
                  let allTasks = JSON.parse(fullTodoData);
                  delete allTasks[item.id];
                  await AsyncStorage.setItem(
                    TODOS_STORAGE_KEY,
                    JSON.stringify(allTasks),
                  );
                }
              }
              loadAllData(); // Refresh list
            } catch (e) {
              console.error("Delete Error", e);
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [user]),
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.noteCard,
        {
          backgroundColor: theme.surface,
          borderTopColor: item.color || theme.primary,
        },
      ]}
      onPress={() =>
        item.type === "note"
          ? navigation.navigate("Notes", {
              noteId: item.id,
              initialTitle: item.title,
              initialContent: item.content,
            })
          : navigation.navigate("TodoList", {
              listid: item.id,
              title: item.title,
              color: item.color,
            })
      }
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons
            name={item.type === "note" ? "document-text" : "checkbox"}
            size={14}
            color={item.color || theme.primary}
          />
          <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>
            {item.type === "note" ? "Note" : "Todo"}
          </Text>
        </View>

        {/* DELETE ICON */}
        <TouchableOpacity onPress={() => deleteItem(item)}>
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={2}>
        {item.title || "Untitled"}
      </Text>

      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
          {item.updated_at || item.created_at
            ? new Date(item.updated_at || item.created_at).toLocaleDateString()
            : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ... (Keep your existing Header useLayoutEffect and return block)
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "ClearDay",
      headerTitleStyle: { fontWeight: "800", fontSize: 20, color: "white" },
      headerStyle: { backgroundColor: theme.primary, elevation: 0 },
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={styles.headerIcon}>
            <Ionicons
              name={isDarkMode ? "sunny" : "moon"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.headerIcon}
          >
            <Ionicons name="person-circle-outline" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TodoList", {
                listid: `local_${Date.now()}`,
                title: "New Task List",
                color: theme.primary,
              })
            }
            style={styles.headerIcon}
          >
            <Ionicons name="add-circle" size={28} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isDarkMode, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <View style={[styles.welcomeArea, { backgroundColor: theme.primary }]}>
        <Text style={styles.welcomeText}>Hello, Emmanuel</Text>
        <Text style={styles.subWelcome}>
          You have {items.length} items in your workspace.
        </Text>
      </View>

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item, index) =>
          item?.id?.toString() || `fallback-id-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAllData}
            tintColor={theme.primary}
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        theme={theme}
      />
    </View>
  );
}

// ... Keep your existing styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", paddingRight: 10 },
  headerIcon: { padding: 8 },
  welcomeArea: {
    paddingHorizontal: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "white" },
  subWelcome: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 5 },
  listContent: { padding: 15, paddingTop: 20, paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between" },
  noteCard: {
    width: width / 2 - 22,
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderTopWidth: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 5,
    textTransform: "uppercase",
  },
  noteTitle: { fontSize: 15, fontWeight: "700", marginBottom: 5 },
  noteFooter: { marginTop: "auto" },
  noteDate: { fontSize: 10 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});
