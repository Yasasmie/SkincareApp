import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { auth, db } from "../../firebaseConfig";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [skinType, setSkinType] = useState("Normal");
  const [role, setRole] = useState<"user" | "dermatologist">("user");
  const [qualifications, setQualifications] = useState("");

  useEffect(() => {
    const loadUserSettings = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return;
      }

      setName(currentUser.displayName || "");

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const userData = snapshot.data();
          if (userData.fullName) setName(userData.fullName);
          if (userData.role === "dermatologist") setRole("dermatologist");
          if (userData.skinType) setSkinType(userData.skinType);
          if (userData.qualifications) setQualifications(userData.qualifications);
        }
      } catch (error) {
        console.warn("[Settings] Failed to load profile data:", error);
      }
    };

    void loadUserSettings();
  }, []);

  const saveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user is logged in.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(currentUser, { displayName: name });

      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          fullName: name,
          skinType: role === "dermatologist" ? null : skinType,
          qualifications: role === "dermatologist" ? qualifications : null,
          updatedAt: Date.now(),
        },
        { merge: true },
      );

      Alert.alert("Saved", "Your profile settings were updated.");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      Alert.alert("Error", "No email is available for this account.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      Alert.alert(
        "Reset Link Sent",
        "Check your email for the password reset link.",
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not send reset email.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <Text style={styles.sectionText}>
          Switch the app appearance between a calm light look and a focused dark look.
        </Text>
        <View style={styles.themeSwitch}>
          {(["light", "dark"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.themeOption,
                themeMode === mode && styles.themeOptionActive,
              ]}
              onPress={() => void setThemeMode(mode)}
            >
              <Ionicons
                name={mode === "light" ? "sunny-outline" : "moon-outline"}
                size={18}
                color={themeMode === mode ? "#FFF" : colors.text}
              />
              <Text
                style={[
                  styles.themeText,
                  themeMode === mode && styles.themeTextActive,
                ]}
              >
                {mode === "light" ? "Light" : "Dark"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Update Profile</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
        />

        {role === "dermatologist" ? (
          <>
            <Text style={styles.label}>Qualifications</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={qualifications}
              onChangeText={setQualifications}
              placeholder="MBBS, MD Dermatology, years of experience..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Skin Type</Text>
            <View style={styles.chipRow}>
              {["Normal", "Oily", "Dry", "Combination"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    skinType === type && styles.chipActive,
                  ]}
                  onPress={() => setSkinType(type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      skinType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <PrimaryButton
          title={loading ? "Saving..." : "Save Profile Changes"}
          onPress={saveProfile}
          loading={loading}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.sectionText}>
          Send a reset link to your email if you want to change your password.
        </Text>
        <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
          <View style={styles.actionIcon}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionText}>Email a secure reset link</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: SPACING.l,
      paddingBottom: SPACING.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: SPACING.xl,
      marginBottom: SPACING.l,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    headerSpacer: {
      width: 40,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.l,
      padding: SPACING.l,
      marginBottom: SPACING.l,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.s,
    },
    sectionText: {
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: SPACING.m,
    },
    themeSwitch: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.round,
      padding: 4,
    },
    themeOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: RADIUS.round,
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
    },
    themeText: {
      marginLeft: SPACING.s,
      fontWeight: "600",
      color: colors.text,
    },
    themeTextActive: {
      color: "#FFF",
    },
    label: {
      color: colors.text,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: SPACING.s,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.m,
      paddingVertical: 14,
      color: colors.text,
      marginBottom: SPACING.m,
    },
    textarea: {
      minHeight: 110,
      paddingTop: SPACING.m,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.s,
      marginBottom: SPACING.m,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.round,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.text,
      fontWeight: "600",
    },
    chipTextActive: {
      color: "#FFF",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary + "18",
      marginRight: SPACING.m,
    },
    actionBody: {
      flex: 1,
    },
    actionTitle: {
      color: colors.text,
      fontWeight: "700",
      marginBottom: 2,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
