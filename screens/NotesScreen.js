import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
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
  AppState, // Added for background saving
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import debounce from "lodash.debounce";
import { lightTheme, darkTheme } from "../Constants/Colors";
import { supabase } from "../config/supabaseConfig";
import { useAuth } from "../context/AuthContext";
import Colors from "../Constants/Colors";
import ColorSelector from "../components/ColorSelector";

const LINE_HEIGHT = 40;

export default function NotesScreen({ navigation, route }) {
  const { user, isOnline, isDarkMode } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const {
    noteId,
    initialTitle,
    initialContent,
    color: initialColor,
  } = route.params || {};

  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [noteColor, setNoteColor] = useState(initialColor || Colors.blue);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT * 20);

  // Refs for auto-saving the latest values
  const latestTitle = useRef(title);
  const latestContent = useRef(content);

  const [history, setHistory] = useState([
    { title: initialTitle || "", content: initialContent || "" },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isInternalUpdate = useRef(false);

  const getNotesPrefix = () => `@notes_offline_data_${user?.uid || "guest"}_`;
  const colorOptions = ["blue", "red", "green", "orange", "purple", "teal"];

  // --- AUTO-SAVE LOGIC ---

  // 1. Persist Function
  const persistData = async (newTitle, newContent, newColor = noteColor) => {
    if (!noteId || !user) return;
    try {
      const noteData = {
        id: noteId,
        title: newTitle,
        content: newContent,
        color: newColor,
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`${getNotesPrefix()}${noteId}`, JSON.stringify(noteData));
      syncToCloud(newTitle, newContent);
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  // 2. Debounced Save (Triggers 1 second after typing stops)
  const debouncedAutoSave = useCallback(
    debounce((t, c) => {
      persistData(t, c);
    }, 1000),
    [noteId, noteColor]
  );

  // 3. App State Listener (Saves if user minimizes app)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        persistData(latestTitle.current, latestContent.current);
      }
    });
    return () => subscription.remove();
  }, [noteId]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const fetchFullNote = async () => {
      if (!noteId || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const storedData = await AsyncStorage.getItem(`${getNotesPrefix()}${noteId}`);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setTitle(parsed.title || "");
          setContent(parsed.content || "");
          latestTitle.current = parsed.title || "";
          latestContent.current = parsed.content || "";
          setNoteColor(parsed.color || initialColor || Colors.blue);
          setHistory([{ title: parsed.title || "", content: parsed.content || "" }]);
        }
      } catch (e) {
        console.error("Error loading note:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullNote();
  }, [noteId, user]);

  // --- UNDO / REDO ---
  const addToHistory = (newTitle, newContent) => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const lastEntry = history[historyIndex];
    if (!lastEntry) return;

    const isWordFinished = /\s$/.test(newContent);
    if ((newContent !== lastEntry.content && isWordFinished) || newTitle !== lastEntry.title) {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory.length > 50) newHistory.shift();
      setHistory([...newHistory, { title: newTitle, content: newContent }]);
      setHistoryIndex(newHistory.length);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isInternalUpdate.current = true;
      const prevStep = history[historyIndex - 1];
      setTitle(prevStep.title);
      setContent(prevStep.content);
      latestTitle.current = prevStep.title;
      latestContent.current = prevStep.content;
      setHistoryIndex(historyIndex - 1);
      persistData(prevStep.title, prevStep.content);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isInternalUpdate.current = true;
      const nextStep = history[historyIndex + 1];
      setTitle(nextStep.title);
      setContent(nextStep.content);
      latestTitle.current = nextStep.title;
      latestContent.current = nextStep.content;
      setHistoryIndex(historyIndex + 1);
      persistData(nextStep.title, nextStep.content);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notes",
      headerStyle: { backgroundColor: noteColor, elevation: 0 },
      headerTintColor: "#fff",
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleUndo} disabled={historyIndex === 0} style={{ opacity: historyIndex === 0 ? 0.3 : 1, marginRight: 15 }}>
            <Ionicons name="arrow-undo" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} disabled={historyIndex === history.length - 1} style={{ opacity: historyIndex === history.length - 1 ? 0.3 : 1, marginRight: 15 }}>
            <Ionicons name="arrow-redo" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowColorPicker(!showColorPicker)} style={{ marginRight: 15 }}>
            <Ionicons name="color-palette" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, noteColor, showColorPicker, historyIndex, history.length]);

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

  const handleColorChange = (selectedColor) => {
    const colorHex = Colors[selectedColor] || selectedColor;
    setNoteColor(colorHex);
    setShowColorPicker(false);
    persistData(title, content, colorHex);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // --- LINE LOGIC ---
  // We add 30 extra lines here so there is always "paper" to scroll onto
  const numberOfLines = Math.ceil(inputHeight / LINE_HEIGHT) + 30;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={noteColor} />

      {showColorPicker && (
        <View style={{ backgroundColor: theme.surface, paddingBottom: 10, elevation: 5 }}>
          <ColorSelector selectedColor={noteColor} colorOptions={colorOptions} onSelect={handleColorChange} />
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Untitled"
            placeholderTextColor={theme.textSecondary + "50"}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              latestTitle.current = v;
              debouncedAutoSave(v, content);
              addToHistory(v, content);
            }}
            multiline
          />

          <View style={styles.inputWrapper}>
            <View style={styles.linesContainer} pointerEvents="none">
              {[...Array(numberOfLines)].map((_, i) => (
                <View key={i} style={[styles.line, { borderBottomColor: isDarkMode ? "#2D3748" : "#F0F0F0" }]} />
              ))}
            </View>

            <TextInput
              style={[styles.contentInput, { color: theme.text, minHeight: inputHeight }]}
              placeholder="Start writing..."
              placeholderTextColor={theme.textSecondary + "50"}
              value={content}
              onChangeText={(v) => {
                setContent(v);
                latestContent.current = v;
                debouncedAutoSave(title, v);
                addToHistory(title, v);
              }}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </View>
          
          {/* EXTRA SPACE: This creates the "plenty additional empty lines" feeling */}
          <View style={{ height: 400 }} /> 
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 20 },
  titleInput: { fontSize: 32, fontWeight: "800", marginBottom: 30, letterSpacing: -0.5 },
  inputWrapper: { position: "relative", width: "100%" },
  linesContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  line: { height: LINE_HEIGHT, borderBottomWidth: 1 },
  contentInput: {
    fontSize: 18,
    lineHeight: LINE_HEIGHT,
    zIndex: 1,
    paddingTop: 0,
    backgroundColor: "transparent",
  },
});