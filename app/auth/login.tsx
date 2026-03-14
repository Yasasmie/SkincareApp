import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { auth } from "../../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />

      <MotionView style={{ width: "100%" }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subHeader}>
          Sign in to continue your skincare journey.
        </Text>
      </MotionView>

      <MotionView delay={100} style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@example.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={{ marginTop: SPACING.m }}>
          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/auth/register")}
          style={styles.footerLink}
        >
          <Text style={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Text style={styles.footerAccent}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </MotionView>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.l,
      justifyContent: "center",
      overflow: "hidden",
    },
    circle1: {
      position: "absolute",
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.secondary,
      opacity: 0.35,
    },
    backButton: { alignSelf: "flex-start", marginBottom: SPACING.m },
    header: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.text,
      letterSpacing: -0.5,
    },
    subHeader: {
      fontSize: 16,
      color: colors.textLight,
      marginTop: SPACING.s,
      marginBottom: SPACING.xl,
    },
    form: {
      backgroundColor: colors.card,
      padding: SPACING.l,
      borderRadius: RADIUS.l,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputContainer: { marginBottom: SPACING.m },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: "600",
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.s,
      padding: SPACING.m,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    footerLink: { alignSelf: "center", marginTop: 20, padding: 10 },
    footerText: { color: colors.textLight },
    footerAccent: { fontWeight: "bold", color: colors.primary },
  });
