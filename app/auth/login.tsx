import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { auth, db } from "../../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"user" | "dermatologist">("user");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : null;
      const role = profile?.role === "dermatologist" ? "dermatologist" : "user";

      if (loginMode === "dermatologist" && role !== "dermatologist") {
        await signOut(auth);
        Alert.alert(
          "Access Denied",
          "This account is not registered as a dermatologist.",
        );
        return;
      }

      if (role === "dermatologist") {
        router.replace("/expert-dashboard");
        return;
      }

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
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              loginMode === "user" && styles.modeButtonActive,
            ]}
            onPress={() => setLoginMode("user")}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={loginMode === "user" ? "#FFF" : colors.primary}
            />
            <Text
              style={[
                styles.modeButtonText,
                loginMode === "user" && styles.modeButtonTextActive,
              ]}
            >
              User Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              loginMode === "dermatologist" && styles.modeButtonActive,
            ]}
            onPress={() => setLoginMode("dermatologist")}
          >
            <Ionicons
              name="medkit-outline"
              size={18}
              color={loginMode === "dermatologist" ? "#FFF" : colors.primary}
            />
            <Text
              style={[
                styles.modeButtonText,
                loginMode === "dermatologist" && styles.modeButtonTextActive,
              ]}
            >
              Dermatologist
            </Text>
          </TouchableOpacity>
        </View>

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
          <PrimaryButton
            title={
              loginMode === "dermatologist"
                ? "Login as Dermatologist"
                : "Login"
            }
            onPress={handleLogin}
            loading={loading}
          />
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
    modeRow: {
      flexDirection: "row",
      gap: SPACING.s,
      marginBottom: SPACING.l,
    },
    modeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: SPACING.m,
      borderRadius: RADIUS.m,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeButtonText: {
      color: colors.text,
      fontWeight: "600",
    },
    modeButtonTextActive: {
      color: "#FFF",
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
