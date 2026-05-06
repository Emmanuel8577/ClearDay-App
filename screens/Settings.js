import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Colors, { lightTheme, darkTheme } from "../Constants/Colors";
import { silentSync } from "../services/SyncService"; // Import your sync logic

export default function Settings() {
  const { user, isOnline, signOut, isDarkMode } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [cacheSize, setCacheSize] = useState("Calculating...");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    success: true,
    message: "Data Up-to-date",
    lastTime: "",
  });

  useEffect(() => {
    calculateCacheSize();
    loadLastSyncStatus();
  }, []);

  const loadLastSyncStatus = async () => {
    const status = await AsyncStorage.getItem(`@sync_status_${user?.id}`);
    if (status) setSyncStatus(JSON.parse(status));
  };

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

  const handleManualSync = async () => {
    if (!isOnline) {
      return Alert.alert("Offline", "Please connect to the internet to sync.");
    }

    setSyncLoading(true);
    try {
      await silentSync(user.id);

      const newStatus = {
        success: true,
        message: "Synchronized Successfully",
        lastTime: new Date().toLocaleString(),
      };

      setSyncStatus(newStatus);
      await AsyncStorage.setItem(
        `@sync_status_${user?.id}`,
        JSON.stringify(newStatus),
      );
      calculateCacheSize(); // Refresh size after sync
    } catch (e) {
      const failStatus = {
        success: false,
        message: "Sync Failed",
        lastTime: new Date().toLocaleString(),
      };
      setSyncStatus(failStatus);
    } finally {
      setSyncLoading(false);
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
              (k) =>
                ![
                  "@current_session_user",
                  "@user_theme",
                  "@local_user_directory",
                ].includes(k),
            );
            await AsyncStorage.multiRemove(dataKeys);
            calculateCacheSize();
            Alert.alert("Success", "Local cache cleared.");
          },
        },
      ],
    );
  };

  useEffect(() => {
  const checkConnection = async () => {
    // Force an alert so we can see it on the PHONE, not just terminal
    const urlExists = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
    const keyExists = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    console.log("--- Diagnostics ---", { urlExists, keyExists });

    if (!urlExists || !keyExists) {
      Alert.alert("Config Error", "Environment variables are missing!");
      return;
    }

    const { data, error } = await supabase.from("notes").select("id").limit(1);

    if (error) {
      Alert.alert("Supabase Error", error.message);
    } else {
      Alert.alert("Success", "Supabase Connection is Live!");
    }
  };
  checkConnection();
}, []);

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    color = theme.text,
    type = "chevron",
    valueColor = Colors.lightGray,
  }) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: isDarkMode ? "#333" : "#eee" }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBg, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && (
          <Text style={[styles.itemValue, { color: valueColor }]}>{value}</Text>
        )}
        {type === "chevron" && (
          <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
        )}
        {type === "switch" && <Switch value={isOnline} disabled={true} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#F8F9FB" },
      ]}
    >
      <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>

        {/* Sync Status Badge */}
        <TouchableOpacity
          onPress={handleManualSync}
          disabled={syncLoading}
          style={[
            styles.badge,
            { backgroundColor: syncStatus.success ? "#E8F5E9" : "#FFEBEE" },
          ]}
        >
          {syncLoading ? (
            <ActivityIndicator size="small" color={Colors.blue} />
          ) : (
            <Text
              style={[
                styles.badgeText,
                { color: syncStatus.success ? "#2E7D32" : "#C62828" },
              ]}
            >
              {syncStatus.message}{" "}
              {syncStatus.lastTime && `at ${syncStatus.lastTime}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.surface,
            borderColor: isDarkMode ? "#333" : "#eee",
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Connectivity & Data</Text>

        <SettingItem
          icon="cloud-upload-outline"
          title="Sync to Cloud"
          value={syncLoading ? "Syncing..." : "Tap to Sync"}
          onPress={handleManualSync}
          color={Colors.blue}
          valueColor={syncStatus.success ? Colors.blue : Colors.red}
        />

        <SettingItem
          icon="cloud-done-outline"
          title="Connection Status"
          value={isOnline ? "Stable" : "No Internet"}
          color={Colors.green}
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

      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.surface,
            borderColor: isDarkMode ? "#333" : "#eee",
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="log-out-outline"
          title="LogOut"
          onPress={handleLogout}
          color={Colors.red}
        />
      </View>

      <Text style={styles.version}>Apex Technovate Ltd v1.0.4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: {
    alignItems: "center",
    padding: 30,
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
  email: { fontSize: 18, fontWeight: "700" },
  badge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  section: {
    marginTop: 25,
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
  itemTitle: { fontSize: 16, fontWeight: "500" },
  itemRight: { flexDirection: "row", alignItems: "center" },
  itemValue: { fontSize: 14, marginRight: 10 },
  version: {
    textAlign: "center",
    color: Colors.lightGray,
    fontSize: 12,
    marginVertical: 30,
  },
});
