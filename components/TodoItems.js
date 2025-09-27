// components/TodoItems.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Colors from "../Constants/Colors";
import Checkbox from "./Checkbox";

const EditableText = ({ isChecked, onChangedText, text, onBlur, ...props }) => {
  const [isEditMode, setIsEditMode] = useState(props.new || false);

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPress={() => !isChecked && setIsEditMode(true)}
      disabled={isChecked}
    >
      {isEditMode ? (
        <TextInput
          underlineColorAndroid="transparent"
          selectionColor={Colors.blue}
          autoFocus={true}
          value={text}
          onChangeText={onChangedText}
          placeholder="Add new item here"
          placeholderTextColor={Colors.lightGray}
          maxLength={100}
          style={styles.input}
          onBlur={() => {
            onBlur && onBlur();
            setIsEditMode(false);
          }}
          multiline={false}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: isChecked ? Colors.lightGray : Colors.black,
              textDecorationLine: isChecked ? "line-through" : "none",
            },
          ]}
        >
          {text || "Empty item"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function TodoItems({ 
  text, 
  isChecked, 
  onChecked, 
  onChangedText, 
  onDelete, 
  onBlur,
  ...props
}) {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Checkbox 
          isChecked={isChecked} 
          onChecked={onChecked}
        />
        <EditableText
          text={text}
          onChangedText={onChangedText}
          isChecked={isChecked}
          onBlur={onBlur}
          {...props}
        />
      </View>
      <TouchableOpacity 
        onPress={onDelete}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.lightGray,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteIcon: {
    fontSize: 24,
    color: Colors.red,
    fontWeight: 'bold',
  },
  input: {
    color: Colors.black,
    borderBottomColor: Colors.blue,
    borderBottomWidth: 1,
    marginHorizontal: 10,
    paddingVertical: 5,
    fontSize: 16,
    flex: 1,
  },
  text: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    flex: 1,
  },
});