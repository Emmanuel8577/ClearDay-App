// screens/Settings.js
import React, { useLayoutEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../screens/firebaseConfig";
import { signOut } from "firebase/auth";
import Colors from "../Constants/Colors";

export default function Settings({ navigation }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  const showComingSoon = (feature) => {
    // Coming soon features - you can implement these later
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => null,
    });
  }, [navigation]);

  const settingsOptions = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => showComingSoon('Notifications'),
    },
    {
      id: 'theme',
      title: 'Themes',
      icon: 'color-palette-outline',
      onPress: () => showComingSoon('Themes'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => showComingSoon('Help & Support'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color={Colors.blue} />
          </View>
          <Text style={styles.userEmail}>
            {auth.currentUser?.email || "No user logged in"}
          </Text>
          <Text style={styles.userLabel}>Logged in as</Text>
        </View>

        {/* Settings Options */}
        <View style={styles.optionsContainer}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name={option.icon} size={22} color={Colors.blue} />
                </View>
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>Fire-App</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Your personal notes and todo management app
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userInfo: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 50,
  },
  userEmail: {
    fontSize: 18,
    color: Colors.black,
    fontWeight: "600",
    marginBottom: 5,
  },
  userLabel: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  optionsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    paddingVertical: 5,
    marginBottom: 30,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e9ecef",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: "500",
  },
  appInfoContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    marginBottom: 20,
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.blue,
    marginBottom: 5,
  },
  appInfoVersion: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 10,
  },
  appInfoDescription: {
    fontSize: 14,
    color: Colors.black,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.blueGray,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});