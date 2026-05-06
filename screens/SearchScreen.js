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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabaseConfig";
import { useAuth } from "../context/AuthContext";
import { lightTheme, darkTheme } from "../Constants/Colors";

export default function SearchScreen({ navigation }) {
  const { isDarkMode, user } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  // Load local data on screen focus to ensure it's fresh
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadLocalLibrary();
    });
    return unsubscribe;
  }, [navigation]);

  const loadLocalLibrary = async () => {
    try {
      const notesRaw = await AsyncStorage.getItem("@notes_offline_data");
      const todosRaw = await AsyncStorage.getItem("@todo_lists_cache");

      const parsedNotes = notesRaw ? Object.values(JSON.parse(notesRaw)) : [];
      const parsedTodos = todosRaw ? JSON.parse(todosRaw) : [];

      const combined = [
        ...parsedNotes.map((n) => ({
          ...n,
          itemType: "isNote",
          uid: n.id || n.noteId,
          searchTitle: n.title || "Untitled Note",
        })),
        ...parsedTodos.map((t) => ({
          ...t,
          itemType: "isTodo",
          uid: t.listid || t.id,
          searchTitle: t.title || "Untitled List",
        })),
      ];
      setLocalData(combined);
    } catch (e) {
      console.error("Local data sync error:", e);
    }
  };

const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    const term = text.toLowerCase().trim();

    // 1. Get Local Results
    const filteredLocal = localData.filter((item) => {
      const titleMatch = item.searchTitle?.toLowerCase().includes(term);
      const contentMatch = item.content?.toLowerCase().includes(term);
      return titleMatch || contentMatch;
    });

    // SET results immediately with ONLY local data first
    setResults(filteredLocal);

    // 2. Fetch Remote (only if text is long enough)
    if (text.length > 2 && user) {
       // We pass the term, but we handle the merge inside the fetch function
       searchSupabase(term);
    }
  };

 const searchSupabase = async (term) => {
    setLoadingRemote(true);
    try {
      const { data: notes } = await supabase.from("notes").select("*").ilike("title", `%${term}%`).eq("user_id", user.id);
      const { data: todos } = await supabase.from("todos").select("*").ilike("title", `%${term}%`).eq("user_id", user.id);

      const remoteItems = [
        ...(notes || []).map((n) => ({ ...n, itemType: "isNote", uid: n.id })),
        ...(todos || []).map((t) => ({ ...t, itemType: "isTodo", uid: t.id })),
      ];

      setResults((prev) => {
        // Create a Map of existing items by UID to ensure uniqueness
        const combinedMap = new Map();
        
        // Add existing (local) items first
        prev.forEach(item => combinedMap.set(String(item.uid), item));
        
        // Add remote items ONLY if they don't exist
        remoteItems.forEach(item => {
          if (!combinedMap.has(String(item.uid))) {
            combinedMap.set(String(item.uid), item);
          }
        });

        return Array.from(combinedMap.values());
      });
    } catch (err) {
      console.warn("Remote search failed", err);
    } finally {
      setLoadingRemote(false);
    }
  };
  
  const handleNavigation = (item) => {
    if (item.itemType === "isNote") {
      navigation.navigate("HomeTab", {
        screen: "Notes",
        params: {
          noteId: item.uid,
          initialTitle: item.title || item.searchTitle,
          initialContent: item.content,
        },
      });
    } else {
      navigation.navigate("HomeTab", {
        screen: "TodoList",
        params: {
          listid: item.uid,
          title: item.title || item.searchTitle,
          color: item.color || theme.primary,
          tasks: item.tasks || [],
        },
      });
    }
  };

  const renderItem = ({ item }) => {
    const isNote = item.itemType === "isNote";
    return (
      <TouchableOpacity
        style={[
          isNote ? styles.noteWrapper : styles.todoWrapper,
          {
            backgroundColor: theme.surface,
            borderLeftColor: isNote
              ? "transparent"
              : item.color || theme.primary,
            borderLeftWidth: isNote ? 0 : 6,
          },
        ]}
        onPress={() => handleNavigation(item)}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name={isNote ? "document-text" : "checkmark-done-circle"}
            size={18}
            color={isNote ? theme.primary : item.color || theme.primary}
          />
          <Text
            style={[styles.cardTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.title || item.searchTitle}
          </Text>
        </View>

        {isNote ? (
          <Text
            style={[styles.excerpt, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.content || "No additional content"}
          </Text>
        ) : (
          <Text style={[styles.excerpt, { color: theme.textSecondary }]}>
            {item.tasks?.length || 0} tasks in this list
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.mainContainer, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Search Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: isDarkMode ? "#333" : "#EEE",
          },
        ]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: isDarkMode ? theme.background : "#F1F2F4" },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Search notes & todos..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {loadingRemote && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelBtn, { color: theme.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      <FlatList
        keyExtractor={(item) => `${item.itemType}-${item.uid}`}
        // Final filter to ensure no duplicates reach the UI
        data={results.filter(
          (v, i, a) => a.findIndex((t) => t.uid === v.uid) === i,
        )}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {query ? "No matches found" : "Type to search your records"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  cancelBtn: { marginLeft: 15, fontWeight: "600" },
  listPadding: { padding: 16 },
  noteWrapper: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  todoWrapper: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginLeft: 8 },
  excerpt: { fontSize: 13, lineHeight: 18 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 15 },
});
