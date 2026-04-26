import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import debounce from "lodash.debounce";
import { lightTheme, darkTheme } from "../Constants/Colors";
import { supabase } from "../config/supabaseConfig";
import { useAuth } from "../context/AuthContext";
import Colors from "../Constants/Colors";
import ColorSelector from "../components/ColorSelector";

const NOTES_CACHE_KEY = "@notes_offline_data_";
const LINE_HEIGHT = 30;

export default function NotesScreen({ navigation, route }) {
  // 1. Get basic info from navigation
  const {
    noteId,
    initialTitle,
    initialContent,
    color: initialColor,
  } = route.params || {};

  // 2. State management
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [noteColor, setNoteColor] = useState(initialColor || Colors.blue);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isOnline, isDarkMode } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const colorOptions = ["blue", "red", "green", "orange", "purple", "teal"];

  // 3. LOAD FULL CONTENT ON MOUNT
  useEffect(() => {
    const fetchFullNote = async () => {
      if (!noteId) {
        setIsLoading(false);
        return;
      }

      try {
        const storedData = await AsyncStorage.getItem(`${NOTES_CACHE_KEY}${noteId}`);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setTitle(parsed.title || "");
          setContent(parsed.content || "");
          setNoteColor(parsed.color || initialColor || Colors.blue);
        }
      } catch (e) {
        console.error("Error loading note content:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullNote();
  }, [noteId]);

  // 4. Update Header UI
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notes",
      headerStyle: { backgroundColor: noteColor, elevation: 0 },
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
  }, [navigation, noteColor, showColorPicker]);

  // 5. Cloud Sync Logic
  const syncToCloud = useCallback(
    debounce(async (t, c) => {
      if (!isOnline || !user) return;
      await supabase.from("notes").upsert({
        id: noteId,
        title: t,
        content: c,
        updated_at: new Date().toISOString(),
        user_id: user?.id,
      });
    }, 1500),
    [noteId, isOnline, user]
  );

  // 6. Persistence logic (Saves to individual file + Home index)
  const persistData = async (newTitle, newContent, newColor = noteColor) => {
    if (!noteId) return;

    const timestamp = new Date().toISOString();
    
    try {
      // Save Full Note File
      const noteData = {
        id: noteId,
        title: newTitle,
        content: newContent,
        color: newColor,
        updated_at: timestamp,
      };
      await AsyncStorage.setItem(`${NOTES_CACHE_KEY}${noteId}`, JSON.stringify(noteData));

      // Update Home Screen Index
      const indexData = await AsyncStorage.getItem("@todo_lists_cache");
      let itemsIndex = indexData ? JSON.parse(indexData) : [];
      const existingIndex = itemsIndex.findIndex((item) => item.id === noteId);

      const noteSummary = {
        id: noteId,
        title: newTitle || "Untitled Note",
        color: newColor,
        updated_at: timestamp,
        type: "note",
      };

      if (existingIndex > -1) {
        itemsIndex[existingIndex] = noteSummary;
      } else {
        itemsIndex.unshift(noteSummary);
      }

      await AsyncStorage.setItem("@todo_lists_cache", JSON.stringify(itemsIndex));

      // Cloud Sync
      syncToCloud(newTitle, newContent);
      
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  const handleColorChange = (selectedColor) => {
    const colorHex = Colors[selectedColor] || selectedColor;
    setNoteColor(colorHex);
    setShowColorPicker(false);
    persistData(title, content, colorHex);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={noteColor} />

      {showColorPicker && (
        <View style={{ backgroundColor: theme.surface, paddingBottom: 10, elevation: 5 }}>
          <ColorSelector
            selectedColor={noteColor}
            colorOptions={colorOptions}
            onSelect={handleColorChange}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Untitled"
            placeholderTextColor={theme.textSecondary + "50"}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              persistData(v, content);
            }}
            multiline
          />

          <View style={styles.inputWrapper}>
            {/* Background Lines */}
            <View style={styles.linesContainer} pointerEvents="none">
              {[...Array(50)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.line,
                    { borderBottomColor: isDarkMode ? "#2D3748" : "#F0F0F0" },
                  ]}
                />
              ))}
            </View>

            <TextInput
              style={[styles.contentInput, { color: theme.text }]}
              placeholder="Start writing..."
              placeholderTextColor={theme.textSecondary + "50"}
              value={content}
              onChangeText={(v) => {
                setContent(v);
                persistData(title, v);
              }}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  linesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: LINE_HEIGHT,
    minHeight: 1500,
    zIndex: 1,
    paddingTop: 0,
  },
});