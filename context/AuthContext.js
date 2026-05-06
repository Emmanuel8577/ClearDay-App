import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const AuthContext = createContext({});
const USER_SESSION_KEY = "@current_session_user"; // Unified Key

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    const initAuth = async () => {
      try {
        // Look for the saved session immediately on app start
        const localData = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          setUser(parsed);
        }
      } catch (e) {
        console.error("Auth Init Error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    return () => unsubscribeNet();
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("@user_theme");
      if (savedTheme) setIsDarkMode(savedTheme === "dark");
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem("@user_theme", newMode ? "dark" : "light");
  };

  const signIn = async (userData) => {
    setUser(userData);
    // Persist the user so they stay logged in
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
    
    const usersRaw = await AsyncStorage.getItem("@local_user_directory");
    let users = usersRaw ? JSON.parse(usersRaw) : [];
    
    if (!users.find(u => u.email === userData.email)) {
      users.push(userData);
      await AsyncStorage.setItem("@local_user_directory", JSON.stringify(users));
    }
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnline,
        isAuthenticated: !!user,
        isDarkMode,
        toggleTheme,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);