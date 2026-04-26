import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Colors from '../Constants/Colors'; 

// Adding = [] ensures that if the parent forgets the prop, it won't crash
export default function ColorSelector({ selectedColor, onSelect, colorOptions = [] }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
    >
      {colorOptions.map((colorName) => {
        // Use the hex code from your Constants, or fallback to the string itself
        const hexColor = Colors[colorName] || colorName; 
        
        return (
          <TouchableOpacity
            key={colorName}
            onPress={() => onSelect(hexColor)}
            activeOpacity={0.7}
            style={[
              styles.colorCircle,
              { backgroundColor: hexColor },
              // Use a border color that stands out if the background is white
              selectedColor === hexColor && styles.selectedCircle
            ]}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 15,
    elevation: 3, // Add shadow so colors pop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Subtle border for light colors
  },
  selectedCircle: {
    borderColor: '#fff', 
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
});