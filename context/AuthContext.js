import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const AuthContext = createContext({});
const USER_SESSION_KEY = "@user_session";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    const initAuth = async () => {
      try {
        const localData = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          setSession(parsed);
          setUser(parsed.user);
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
    const localSession = { access_token: "local_auth_token", user: userData };
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(localSession));
    setSession(localSession);
    setUser(userData);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
