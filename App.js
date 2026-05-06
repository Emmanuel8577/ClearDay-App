import React, { useEffect } from "react";
import { View, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native"; // 1. Added helper
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from 'expo-updates';

import { AuthProvider, useAuth } from './context/AuthContext';
import Home from "./screens/Home";
import TodoList from "./screens/TodoList"; 
import EditList from "./screens/EditList";
import NotesScreen from "./screens/NotesScreen";
import CalendarScreen from "./screens/CalendarScreen";
import SearchScreen from "./screens/SearchScreen";
import Login from "./screens/Login";
import SettingsScreen from "./screens/Settings";
import Colors from "./Constants/Colors";
import { silentSync } from "./services/SyncService";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Navigation Stacks ---
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="HomeScreen" component={Home} options={{ title: "ClearDay", headerStyle: { backgroundColor: Colors.blue }, headerTintColor: "white" }} />
    <Stack.Screen name="TodoList" component={TodoList} options={({ route }) => ({ title: route.params?.title || "Todo List", headerStyle: { backgroundColor: route.params?.color || Colors.blue }, headerTintColor: "white" })} />
    <Stack.Screen name="Edit" component={EditList} options={({ route }) => ({ title: route.params?.title ? `Edit ${route.params.title}` : "New List", headerStyle: { backgroundColor: route.params?.color || Colors.blue }, headerTintColor: "white" })} />
    <Stack.Screen name="Notes" component={NotesScreen} options={({ route }) => ({ title: route.params?.title || "Note", headerStyle: { backgroundColor: Colors.blue }, headerTintColor: "white" })} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: "Settings", headerStyle: { backgroundColor: Colors.blue }, headerTintColor: "white" }} />
  </Stack.Navigator>
);

// --- Bottom Tab Navigator with Safe Height ---
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === 'android' ? 70 + insets.bottom : 65 + insets.bottom;

  // 2. Logic to hide the Tab Bar
  const getTabBarVisibility = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "HomeScreen";
    // Define screens where the tab bar should be HIDDEN
    if (routeName === "Notes" || routeName === "Edit" || routeName === "TodoList") {
      return "none"; 
    }
    return "flex";
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = route.name === 'HomeTab' ? 'home' : route.name === 'CalendarTab' ? 'calendar' : route.name === 'SearchTab' ? 'search' : 'settings';
          return <Ionicons name={focused ? iconName : `${iconName}-outline`} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        // 3. Apply the display style dynamically
        tabBarStyle: { 
          display: getTabBarVisibility(route),
          height: TAB_BAR_HEIGHT, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'android' ? 5 : 0
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ title: "Calendar" }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: "Search" }} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
};

// --- App Content with OTA Update Logic ---
const AppContent = () => {
  const { user, loading, isOnline } = useAuth();

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log("OTA Update check skipped:", error);
      }
    }
    if (!__DEV__) onFetchUpdateAsync();
  }, []);

  useEffect(() => {
    if (isOnline && user?.id) {
      silentSync(user.id).catch(err => console.log("Sync error:", err));
    }
  }, [isOnline, user?.id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  }
});