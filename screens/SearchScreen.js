import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../Constants/Colors";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSearchLibrary();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSearchLibrary = async () => {
    try {
      const notesData = await AsyncStorage.getItem("@notes_offline_data") || "{}";
      const todosData = await AsyncStorage.getItem("@todo_lists_cache") || "[]";

      const notes = Object.values(JSON.parse(notesData));
      const todos = JSON.parse(todosData);

      const combined = [
        ...notes.map((n) => ({ 
          ...n, 
          itemType: "isNote", // Strict flag to prevent UI mixing
          uid: n.id || n.noteId 
        })),
        ...todos.map((t) => ({ 
          ...t, 
          itemType: "isTodo", 
          uid: t.listid || t.id 
        })),
      ];
      setAllData(combined);
    } catch (e) {
      console.error("Data load error:", e);
    }
  };

  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    const filtered = allData.filter(item => 
      item.title?.toLowerCase().includes(text.toLowerCase()) ||
      item.content?.toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  const handleNavigation = (item) => {
    if (item.itemType === "isNote") {
      // MATCHING YOUR HOME SCREEN LOGIC EXACTLY
      navigation.navigate('HomeTab', {
        screen: 'Notes',
        params: { 
          noteId: item.uid,        // Your NotesScreen expects 'noteId'
          initialTitle: item.title, // Your NotesScreen expects 'initialTitle'
          initialContent: item.content // Your NotesScreen expects 'initialContent'
        },
      });
    } else {
      // MATCHING TODO LOGIC
      navigation.navigate('HomeTab', {
        screen: 'TodoList',
        params: { 
          listid: item.uid, 
          title: item.title,
          color: item.color || Colors.blue,
          tasks: item.tasks || []
        },
      });
    }
  };

  // --- EXCLUSIVE NOTE UI ---
  const renderNoteCard = (item) => (
    <TouchableOpacity 
      style={styles.noteWrapper} 
      onPress={() => handleNavigation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteTop}>
        <Ionicons name="document-text" size={18} color={Colors.blue} />
        <Text style={styles.noteHeading} numberOfLines={1}>{item.title}</Text>
      </View>
      <Text style={styles.noteExcerpt} numberOfLines={3}>
        {item.content || "Empty note content"}
      </Text>
      <View style={styles.noteTypeBadge}>
        <Text style={styles.badgeLabel}>NOTE</Text>
      </View>
    </TouchableOpacity>
  );

  // --- EXCLUSIVE TODO UI ---
  const renderTodoCard = (item) => (
    <TouchableOpacity 
      style={[styles.todoWrapper, { borderLeftColor: item.color || Colors.blue }]} 
      onPress={() => handleNavigation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.todoTop}>
        <Text style={styles.todoHeading}>{item.title}</Text>
        <Ionicons name="checkmark-done-circle" size={18} color={item.color || Colors.blue} />
      </View>
      <View style={styles.taskPreviewList}>
        {item.tasks?.slice(0, 2).map((t, i) => (
          <Text key={i} style={styles.taskPreviewText} numberOfLines={1}>
            • {t.task}
          </Text>
        ))}
        <Text style={styles.taskCount}>{item.tasks?.length || 0} items in list</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchField}
            placeholder="Search your notes and todos..."
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, index) => `${item.itemType}-${item.uid}-${index}`}
        renderItem={({ item }) => 
          item.itemType === "isNote" ? renderNoteCard(item) : renderTodoCard(item)
        }
        contentContainerStyle={styles.listArea}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {query ? "No results found" : "Enter a title to search"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F7F8FA" },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2F4",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchField: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
  cancelLink: { marginLeft: 15, color: Colors.blue, fontWeight: "600" },
  listArea: { padding: 16 },

  // NOTE CARD STYLES
  noteWrapper: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  noteTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  noteHeading: { fontSize: 17, fontWeight: "700", color: "#111", marginLeft: 8 },
  noteExcerpt: { fontSize: 14, color: "#666", lineHeight: 21 },
  noteTypeBadge: { marginTop: 12, alignSelf: "flex-start", backgroundColor: "#E3F2FD", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeLabel: { fontSize: 10, color: Colors.blue, fontWeight: "800" },

  // TODO CARD STYLES
  todoWrapper: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    elevation: 1,
  },
  todoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  todoHeading: { fontSize: 17, fontWeight: "800", color: "#222" },
  taskPreviewList: { marginTop: 4 },
  taskPreviewText: { fontSize: 13, color: "#555", marginBottom: 2 },
  taskCount: { fontSize: 11, color: "#999", marginTop: 6, fontWeight: "600" },

  emptyBox: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#AAA", fontSize: 16 },
});