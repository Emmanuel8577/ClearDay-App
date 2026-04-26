// components/Button.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Colors from "../Constants/Colors";

export default function Button({ onPress, buttonStyle, textStyle, text }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.button, buttonStyle]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    minHeight: 50,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});