// App.js - UPDATED WITH AUTH PROVIDER
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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
import { View, ActivityIndicator } from "react-native";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={Home}
        options={{
          title: "ClearDay",
          headerStyle: {
            backgroundColor: Colors.blue,
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="TodoList" 
        component={TodoList}
        options={({ route }) => ({
          title: route.params?.title || "Todo List", 
          headerStyle: {
            backgroundColor: route.params?.color || Colors.blue, 
          },
          headerTintColor: "white",
        })}
      />
      <Stack.Screen
        name="Edit"
        component={EditList}
        options={({ route }) => ({
          title: route.params?.title ? `Edit ${route.params.title} List` : "Create new list",
          headerStyle: {
            backgroundColor: route.params?.color || Colors.blue, 
          },
          headerTintColor: "white",
        })}
      />
      <Stack.Screen
        name="Notes"
        component={NotesScreen}
        options={({ route }) => ({
          title: route.params?.title || "Note",
          headerStyle: {
            backgroundColor: Colors.blue,
          },
          headerTintColor: "white",
        })}
      />
    </Stack.Navigator>
  );
};

const CalendarStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalendarScreen" 
        component={CalendarScreen}
        options={{
          title: "Calendar",
          headerStyle: {
            backgroundColor: Colors.blue,
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchScreen" 
        component={SearchScreen}
        options={{
          title: "Search",
          headerStyle: {
            backgroundColor: Colors.blue,
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const SettingsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsScreen" 
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerStyle: {
            backgroundColor: Colors.blue,
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CalendarTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 97,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ title: "Home" }}
      />
      <Tab.Screen 
        name="CalendarTab" 
        component={CalendarStack} 
        options={{ title: "Calendar" }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStack} 
        options={{ title: "Search" }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}