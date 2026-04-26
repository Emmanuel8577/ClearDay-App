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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Colors from "../Constants/Colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleAuthAction = async (isSignUp = false) => {
    if (!email || !password) return Alert.alert("Error", "Fill in all fields");
    setLoading(true);
    try {
      const userObj = {
        id: "user_" + Date.now(),
        email: email.trim().toLowerCase(),
      };
      await signIn(userObj);
      if (isSignUp) Alert.alert("Welcome!", "Account created locally.");
    } catch (error) {
      Alert.alert("Error", "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="sunny-outline" size={60} color="white" />
          </View>
          <Text style={styles.title}>ClearDay</Text>
          <Text style={styles.subtitle}>Your day, perfectly curated.</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => handleAuthAction(false)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signUpButton]}
            onPress={() => handleAuthAction(true)}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: Colors.blue }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.blue },
  innerContainer: { flex: 1, justifyContent: "center" },
  headerSection: { alignItems: "center", marginBottom: 30, paddingTop: 50 },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 36, fontWeight: "bold", color: "white" },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)" },
  formSection: {
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 60,
    borderWidth: 1,
    borderColor: "#eee",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  button: {
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButton: { backgroundColor: Colors.blue },
  signUpButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.blue,
  },
  buttonText: { fontSize: 18, fontWeight: "bold", color: "white" },
});
