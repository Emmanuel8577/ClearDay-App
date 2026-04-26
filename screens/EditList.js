import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import LabeledInput from "../components/LabeledInput";
import ColorSelector from "../components/ColorSelector";
import Colors from "../Constants/Colors";
import { supabase } from "../config/supabaseConfig";

export default function EditScreen({ route, navigation }) {
  const { item, type } = route.params;
  const [title, setTitle] = useState(item.title);
  const [selectedColor, setSelectedColor] = useState(item.color || Colors.blue);

  const handleUpdate = async () => {
    const table = type === "note" ? "notes" : "todos";
    const { error } = await supabase
      .from(table)
      .update({ title, color: selectedColor })
      .eq("id", item.id);

    if (!error) {
      Alert.alert("Updated", "Changes saved successfully.");
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <LabeledInput label="Title" text={title} onChangeText={setTitle} />
      {type === "todo" && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Identify with Color</Text>
          <ColorSelector
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
            colorOptions={["blue", "teal", "green", "red", "purple"]}
          />
        </View>
      )}
      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  saveBtn: {
    backgroundColor: Colors.blue,
    padding: 18,
    borderRadius: 15,
    marginTop: 40,
    alignItems: "center",
  },
  saveText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
