import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Colors from "../Constants/Colors";

export default function Settings() {
  const { user, isOnline, signOut } = useAuth();
  const [cacheSize, setCacheSize] = useState("Calculating...");

  useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      let totalSize = 0;
      items.forEach(([key, value]) => {
        totalSize += (key?.length || 0) + (value?.length || 0);
      });
      setCacheSize(`${(totalSize / 1024).toFixed(2)} KB`);
    } catch (e) {
      setCacheSize("Unknown");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure? Your offline data will remain on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => signOut() },
      ],
    );
  };

  const clearLocalCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will remove locally saved notes and todos.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const dataKeys = keys.filter(
              (k) => k !== "@user_session" && k !== "@user_theme",
            );
            await AsyncStorage.multiRemove(dataKeys);
            calculateCacheSize();
            Alert.alert("Success", "Local cache cleared.");
          },
        },
      ],
    );
  };

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    color = Colors.black,
    type = "chevron",
  }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconBg, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        {type === "chevron" && (
          <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
        )}
        {type === "switch" && <Switch value={isOnline} disabled={true} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isOnline ? "#E8F5E9" : "#FFEBEE" },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isOnline ? "#2E7D32" : "#C62828" },
            ]}
          >
            {isOnline ? "Online Sync Active" : "Offline Mode"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connectivity & Data</Text>
        <SettingItem
          icon="cloud-done-outline"
          title="Connection Status"
          value={isOnline ? "Stable" : "No Internet"}
          color={Colors.blue}
          type="switch"
        />
        <SettingItem
          icon="server-outline"
          title="Local Storage"
          value={cacheSize}
          color={Colors.purple}
        />
        <SettingItem
          icon="refresh-outline"
          title="Clear Local Cache"
          onPress={clearLocalCache}
          color={Colors.orange}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="person-outline"
          title="Profile Details"
          color={Colors.teal}
        />
        <SettingItem
          icon="log-out-outline"
          title="LogOut"
          onPress={handleLogout}
          color={Colors.red}
        />
      </View>
      <Text style={styles.version}>AllCurate v1.0.4 • Built for Nigeria</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  profileSection: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: { fontSize: 32, color: "white", fontWeight: "bold" },
  email: { fontSize: 18, fontWeight: "700", color: Colors.black },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  section: {
    marginTop: 25,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.lightGray,
    marginLeft: 20,
    marginTop: 15,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemTitle: { fontSize: 16, color: Colors.black, fontWeight: "500" },
  itemRight: { flexDirection: "row", alignItems: "center" },
  itemValue: { fontSize: 14, color: Colors.lightGray, marginRight: 10 },
  version: {
    textAlign: "center",
    color: Colors.lightGray,
    fontSize: 12,
    marginVertical: 30,
  },
});
