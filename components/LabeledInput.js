// components/LabeledInput.js
import React from "react";
import { View, StyleSheet, Text, TextInput } from "react-native";
import Colors from "../Constants/Colors";

export default function LabeledInput({ 
  labelStyle, 
  label, 
  errorMessage, 
  text, 
  onChangeText, 
  ...inputProps 
}) {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.defaultLabel, labelStyle]}>{label}</Text>
        {errorMessage && (
          <Text style={styles.error}>*{errorMessage}</Text>
        )}
      </View>
      <TextInput
        underlineColorAndroid="transparent"
        selectionColor={Colors.blue}
        value={text}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={Colors.lightGray}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: 'center',
  },
  defaultLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.black,
  },
  error: {
    color: Colors.red,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  input: {
    borderBottomColor: Colors.lightGray,
    borderBottomWidth: 1,
    paddingLeft: 4,
    paddingVertical: 8,
    height: 40,
    fontSize: 16,
    color: Colors.black,
  },
});