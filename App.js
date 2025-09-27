// App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Home from "./screens/Home";
import TodoList from "./screens/TodoList"; 
import EditList from "./screens/EditList";
import NotesScreen from "./screens/NotesScreen";
import Calendar from "./screens/CalendarScreen";
import Search from "./screens/SearchScreen";
import Login from "./screens/Login";
import Settings from "./screens/Settings";
import Colors from "./Constants/Colors";
import { auth } from "./screens/firebaseConfig";
import { onAuthStateChanged } from 'firebase/auth';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

const AuthScreens = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Login} />
    </AuthStack.Navigator>
  );
};

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
        name="NotesScreen"
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
        component={Calendar}
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
        component={Search}
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
        component={Settings}
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

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Settings') {
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
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthScreens />}
    </NavigationContainer>
  );
}