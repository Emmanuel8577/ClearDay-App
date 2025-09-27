// screens/Login.js
import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Button from "../components/Button";
import LabeledInput from "../components/LabeledInput";
import Colors from "../Constants/Colors";
import validator from "validator";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const validateFields = (email, password) => {
    const isValid = {
        email: validator.isEmail(email),
        password: validator.isStrongPassword(password, {
            minLength: 8
        })
    };
    return isValid;
};

const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully!");
    } catch (error) {
        console.log("Login error:", error.message);
        Alert.alert("Login Error", error.message);
    }
};

const createAccount = async (email, password) => {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User account created successfully!");
        
        // Create user document in Firestore
        const userDoc = doc(db, "users", user.uid);
        await setDoc(userDoc, {
            email: user.email,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.log("Account creation error:", error.message);
        Alert.alert("Account Creation Error", error.message);
    }
};

export default function LoginScreen() {
    const [isCreateMode, setCreateMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailField, setEmailField] = useState({
        text: "",
        errorMessage: ""
    });
    const [passwordField, setPasswordField] = useState({
        text: "",
        errorMessage: ""
    });
    const [passwordReentryField, setPasswordReentryField] = useState({
        text: "",
        errorMessage: ""
    });

    const handleSubmit = async () => {
        setIsLoading(true);
        
        const isValid = validateFields(emailField.text, passwordField.text);
        let isAllValid = true;

        // Clear previous errors
        setEmailField(prev => ({ ...prev, errorMessage: "" }));
        setPasswordField(prev => ({ ...prev, errorMessage: "" }));
        setPasswordReentryField(prev => ({ ...prev, errorMessage: "" }));

        if (!isValid.email) {
            setEmailField(prev => ({
                ...prev,
                errorMessage: "Please enter a valid email"
            }));
            isAllValid = false;
        }

        if (!isValid.password) {
            setPasswordField(prev => ({
                ...prev,
                errorMessage: "Password must be at least 8 characters with numbers and symbols"
            }));
            isAllValid = false;
        }

        if (isCreateMode && passwordReentryField.text !== passwordField.text) {
            setPasswordReentryField(prev => ({
                ...prev,
                errorMessage: "Passwords do not match"
            }));
            isAllValid = false;
        }

        if (isAllValid) {
            if (isCreateMode) {
                await createAccount(emailField.text, passwordField.text);
            } else {
                await login(emailField.text, passwordField.text);
            }
        }
        
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradientBackground}
            >
                <KeyboardAvoidingView 
                    style={styles.keyboardContainer}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                        <View style={styles.headerContainer}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoEmoji}>🔥</Text>
                                <Text style={styles.logoText}>Todo</Text>
                            </View>
                            <Text style={styles.subtitle}>
                                {isCreateMode ? "Create your account" : "Welcome back"}
                            </Text>
                        </View>
                        
                        <View style={styles.formCard}>
                            <View style={styles.formContainer}>
                                <LabeledInput
                                    label="Email"
                                    text={emailField.text}
                                    onChangeText={(text) => {
                                        setEmailField({ text, errorMessage: "" });
                                    }}
                                    errorMessage={emailField.errorMessage}
                                    labelStyle={styles.label}
                                    autoCompleteType="email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                
                                <LabeledInput
                                    label="Password"
                                    text={passwordField.text}
                                    onChangeText={(text) => {
                                        setPasswordField({ text, errorMessage: "" });
                                    }}
                                    secureTextEntry={true}
                                    errorMessage={passwordField.errorMessage}
                                    labelStyle={styles.label}
                                    autoCompleteType="password"
                                />
                                
                                {isCreateMode && (
                                    <LabeledInput
                                        label="Re-enter Password"
                                        text={passwordReentryField.text}
                                        onChangeText={(text) => {
                                            setPasswordReentryField({ text, errorMessage: "" });
                                        }}
                                        secureTextEntry={true}
                                        errorMessage={passwordReentryField.errorMessage}
                                        labelStyle={styles.label}
                                    />
                                )}

                                <Button
                                    onPress={handleSubmit}
                                    text={isLoading ? "Loading..." : (isCreateMode ? "Create Account" : "Login")}
                                    buttonStyle={[
                                        styles.submitButton,
                                        isLoading && styles.disabledButton
                                    ]}
                                    disabled={isLoading}
                                />

                                <TouchableOpacity 
                                    onPress={() => setCreateMode(!isCreateMode)}
                                    style={styles.toggleButton}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.toggleText}>
                                        {isCreateMode ? "Already have an account? Login" : "Don't have an account? Create one"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 40,
        paddingTop: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    logoText: {
        fontSize: 48,
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '300',
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.black,
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: '#667eea',
        minHeight: 55,
        borderRadius: 15,
        marginTop: 20,
        marginBottom: 15,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: Colors.lightGray,
        shadowOpacity: 0,
        elevation: 0,
    },
    toggleButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    toggleText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
    },
});