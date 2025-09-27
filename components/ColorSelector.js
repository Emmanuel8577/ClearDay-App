// components/ColorSelector.js
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../Constants/Colors";

const ColorButton = ({ onPress, isSelected, color }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.colorButton,
        { 
          backgroundColor: color,
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? Colors.black : Colors.lightGray
        },
      ]}
      activeOpacity={0.8}
    />
  );
};

export default function ColorSelector({ selectedColor, colorOptions, onSelect }) {
  return (
    <View style={styles.container}>
      {colorOptions.map((colorName) => (
        <ColorButton
          key={colorName}
          onPress={() => onSelect(Colors[colorName])}
          color={Colors[colorName]}
          isSelected={Colors[colorName] === selectedColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  colorButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});