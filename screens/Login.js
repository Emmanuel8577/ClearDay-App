import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabaseConfig"; // Ensure this path is correct
import Colors, { lightTheme, darkTheme } from "../Constants/Colors";

export default function LoginScreen() {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, isDarkMode } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleAuthAction = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (isSignUpMode && !username) {
      return Alert.alert("Error", "Please enter your full name.");
    }

    setLoading(true);

    try {
      if (isSignUpMode) {
        // --- REAL SIGN UP WITH SUPABASE ---
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { display_name: username.trim() },
          },
        });

        if (error) throw error;

        // Supabase sends a confirmation email by default.
        // If it's disabled in dashboard, it logs in immediately.
        if (data.user) {
          Alert.alert("Success", "Account created successfully!");
          await signIn(data.user);
        }
      } else {
        // --- REAL SIGN IN WITH SUPABASE ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          // Handle specific Supabase error messages
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect email or password.");
          }
          throw error;
        }

        if (data.user) {
          await signIn(data.user);
        }
      }
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: Colors.blue }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="sunny-outline" size={60} color="white" />
          </View>
          <Text style={styles.title}>ClearDay</Text>
          <Text style={styles.subtitle}>Your day, perfectly curated.</Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>
            {isSignUpMode ? "Create Account" : "Welcome Back"}
          </Text>

          {isSignUpMode && (
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#f9f9f9",
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
              />
            </View>
          )}

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDarkMode ? "#2d2d2d" : "#f9f9f9",
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email Address"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDarkMode ? "#2d2d2d" : "#f9f9f9",
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleAuthAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUpMode ? "Register" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeToggleBtn}
            onPress={() => setIsSignUpMode(!isSignUpMode)}
          >
            <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
              {isSignUpMode ? "Already have an account? " : "New here? "}
              <Text style={{ color: Colors.blue, fontWeight: "bold" }}>
                {isSignUpMode ? "Sign In" : "Create a new account"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 34, fontWeight: "bold", color: "white" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)" },
  formSection: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    flex: 1,
    minHeight: 450,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 60,
    borderWidth: 1,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  button: {
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  loginButton: { backgroundColor: Colors.blue, elevation: 2 },
  buttonText: { fontSize: 18, fontWeight: "bold", color: "white" },
  modeToggleBtn: { marginTop: 25, alignItems: "center" },
  toggleText: { fontSize: 14 },
});
