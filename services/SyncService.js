import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabaseConfig";

export const silentSync = async (userId) => {
  if (!userId) return { success: false, message: "No User ID" };

  try {
    const allKeys = await AsyncStorage.getAllKeys();

    // 1. Separate the keys
    const noteKeys = allKeys.filter(
      (k) => k.includes("notes_offline_data") && !k.includes("sync_status"),
    );
    const todoKeys = allKeys.filter(
      (k) => k.includes("todos_offline_data") && !k.includes("sync_status"),
    );

    // 2. Prepare Notes
    const localNotes = await AsyncStorage.multiGet(noteKeys);
    const notesToSync = localNotes.map(([key, value]) => {
      const item = JSON.parse(value);
      return {
        id: item.id || key.replace("@notes_offline_data_", ""),
        user_id: userId,
        title: item.title || "Untitled",
        content: item.content || "",
        color: item.color || "#ffffff",
        updated_at: new Date().toISOString(),
      };
    });

    // 3. Prepare Todos
    const localTodos = await AsyncStorage.multiGet(todoKeys);
    let todosToSync = [];

    localTodos.forEach(([key, value]) => {
      const parsedValue = JSON.parse(value);

      // If your todo data is an array [{}, {}], we must flat map it
      if (Array.isArray(parsedValue)) {
        parsedValue.forEach((todo, index) => {
          todosToSync.push({
            id: todo.id || `${key}_${index}`, // Ensure unique ID
            user_id: userId,
            task: todo.task || todo.text || "New Task",
            is_completed: !!(todo.is_completed || todo.completed),
            updated_at: new Date().toISOString(),
          });
        });
      } else {
        // If it's just a single object per key
        todosToSync.push({
          id: parsedValue.id || key.split("_").pop(),
          user_id: userId,
          task: parsedValue.task || parsedValue.text || "New Task",
          is_completed: !!(parsedValue.is_completed || parsedValue.completed),
          updated_at: new Date().toISOString(),
        });
      }
    });
    // 4. Batch Upload to respective tables
    if (notesToSync.length > 0) {
      const { error: nError } = await supabase
        .from("notes")
        .upsert(notesToSync);
      if (nError) throw nError;
    }

    if (todosToSync.length > 0) {
      const { error: tError } = await supabase
        .from("todos")
        .upsert(todosToSync);
      if (tError) throw tError;
    }

    return { success: true };
  } catch (error) {
    console.error("Multi-Table Sync Error:", error.message);
    throw error;
  }
};
