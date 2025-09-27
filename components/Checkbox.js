// components/Checkbox.js
import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import Colors from "../Constants/Colors";

export default function Checkbox({ isChecked, onChecked, ...props }) {
  return (
    <TouchableOpacity 
      style={[styles.checkbox, isChecked && styles.checkedBox]} 
      onPress={onChecked}
      activeOpacity={0.7}
      {...props}
    >
      {isChecked && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderRadius: 4,
    borderColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: 'bold',
  },
});