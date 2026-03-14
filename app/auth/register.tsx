import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
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

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skinType, setSkinType] = useState("Normal");
  const [accountType, setAccountType] = useState<"user" | "dermatologist">("user");
  const [qualifications, setQualifications] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    if (accountType === "dermatologist" && !qualifications.trim()) {
      Alert.alert(
        "Missing Info",
        "Please enter your dermatologist qualifications.",
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: fullName,
        fullName,
        email,
        skinType: accountType === "user" ? skinType : null,
        role: accountType,
        qualifications: accountType === "dermatologist" ? qualifications.trim() : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        photoURL: null,
      });

      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const SkinTypeOption = ({ type }: { type: string }) => (
    <TouchableOpacity
      onPress={() => setSkinType(type)}
      style={[styles.option, skinType === type && styles.optionSelected]}
    >
      <Text
        style={[
          styles.optionText,
          skinType === type && styles.optionTextSelected,
        ]}
      >
        {type}
      </Text>
    </TouchableOpacity>
  );

  const AccountTypeOption = ({
    type,
    label,
    icon,
  }: {
    type: "user" | "dermatologist";
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <TouchableOpacity
      onPress={() => setAccountType(type)}
      style={[
        styles.accountTypeCard,
        accountType === type && styles.accountTypeCardSelected,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={accountType === type ? "#FFF" : colors.primary}
      />
      <Text
        style={[
          styles.accountTypeTitle,
          accountType === type && styles.accountTypeTitleSelected,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.accountTypeSubtitle,
          accountType === type && styles.accountTypeSubtitleSelected,
        ]}
      >
        {type === "user"
          ? "Track your skin and request expert help"
          : "Review consultations and reply as an expert"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.circle2} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <MotionView>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>Start your journey to better skin.</Text>
      </MotionView>

      <MotionView delay={100} style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Register As</Text>
          <View style={styles.accountTypeRow}>
            <AccountTypeOption type="user" label="User" icon="person-outline" />
            <AccountTypeOption
              type="dermatologist"
              label="Dermatologist"
              icon="medkit-outline"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane Doe"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="jane@example.com"
            keyboardType="email-address"
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

        {accountType === "user" ? (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What&apos;s your skin type?</Text>
            <View style={styles.optionsRow}>
              {["Oily", "Dry", "Normal", "Combination"].map((type) => (
                <SkinTypeOption key={type} type={type} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Qualifications</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="MBBS, MD Dermatology, years of experience..."
              placeholderTextColor={colors.textSecondary}
              value={qualifications}
              onChangeText={setQualifications}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={{ height: 20 }} />
        <PrimaryButton
          title={
            accountType === "dermatologist"
              ? "Register as Dermatologist"
              : "Sign Up"
          }
          onPress={handleSignUp}
          loading={loading}
        />

        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          style={styles.footerLink}
        >
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerAccent}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </MotionView>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: SPACING.l },
    circle2: {
      position: "absolute",
      top: 50,
      left: -50,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.accent,
      opacity: 0.16,
    },
    backButton: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.m,
      alignSelf: "flex-start",
    },
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputContainer: { marginBottom: SPACING.m },
    accountTypeRow: { gap: SPACING.m },
    accountTypeCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountTypeCardSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    accountTypeTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginTop: SPACING.s,
    },
    accountTypeTitleSelected: { color: "#FFF" },
    accountTypeSubtitle: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 4,
      lineHeight: 18,
    },
    accountTypeSubtitleSelected: { color: "rgba(255,255,255,0.85)" },
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
    textarea: {
      minHeight: 96,
      paddingTop: SPACING.m,
    },
    optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    option: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: "transparent",
    },
    optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionText: { color: colors.textLight, fontSize: 14 },
    optionTextSelected: { color: "#FFF", fontWeight: "bold" },
    footerLink: { alignSelf: "center", marginTop: 20, padding: 10 },
    footerText: { color: colors.textLight },
    footerAccent: { fontWeight: "bold", color: colors.primary },
  });
