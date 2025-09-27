// screens/EditList.js
import React, { useState } from "react";
import { View, StyleSheet, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Colors from "../Constants/Colors";
import ColorSelector from "../components/ColorSelector";
import Button from "../components/Button";

const colorList = [
  "blue",
  "teal", 
  "green",
  "olive",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blueGray",
];

export default function EditList({ navigation, route }) {
  const [title, setTitle] = useState(route.params?.title || "");
  const [color, setColor] = useState(route.params?.color || Colors.blue);

  const handleSave = () => {
    if (title.trim().length === 0) {
      return;
    }

    if (route.params?.saveChanges) {
      route.params.saveChanges({ 
        title: title.trim(), 
        color 
      });
    }
    
    navigation.goBack();
  };

  const handleColorSelect = (selectedColor) => {
    setColor(selectedColor);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>List Name</Text>
            <TextInput
              underlineColorAndroid="transparent"
              selectionColor={color}
              autoFocus={!route.params?.title}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter list name"
              placeholderTextColor={Colors.lightGray}
              maxLength={30}
              style={[
                styles.input,
                { borderBottomColor: color }
              ]}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text style={styles.charCount}>{title.length}/30</Text>
          </View>

          <View style={styles.colorSection}>
            <Text style={styles.label}>Choose Color</Text>
            <Text style={styles.subtitle}>Pick a color that represents your list</Text>
            <ColorSelector
              onSelect={handleColorSelect}
              selectedColor={color}
              colorOptions={colorList}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            text={route.params?.title ? "Update List" : "Create List"}
            onPress={handleSave}
            buttonStyle={[
              styles.saveButton,
              { backgroundColor: color }
            ]}
          />
          
          <Button
            text="Cancel"
            onPress={() => navigation.goBack()}
            buttonStyle={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 40,
  },
  colorSection: {
    marginBottom: 30,
  },
  label: {
    color: Colors.black,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 15,
  },
  input: {
    color: Colors.black,
    borderBottomWidth: 2,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: 'right',
    marginTop: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  saveButton: {
    minHeight: 50,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    minHeight: 50,
  },
  cancelButtonText: {
    color: Colors.black,
  },
});