import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { createOrUpdateUserProfile, getUserProfile } from "../../services/firebaseUserService";

export default function UserDetailsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [skinType, setSkinType] = useState<"oily" | "dry" | "combination" | "normal" | "sensitive" | "">("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);

  const genderOptions: ("male" | "female" | "other")[] = ["male", "female", "other"];
  const skinTypeOptions: ("oily" | "dry" | "combination" | "normal" | "sensitive")[] = ["oily", "dry", "combination", "normal", "sensitive"];
  const concernsOptions = ["Acne", "Wrinkles", "Dark Spots", "Sensitivity", "Oiliness", "Dryness", "Redness", "Pores"];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          if (profile.age) setAge(profile.age.toString());
          if (profile.gender) setGender(profile.gender);
          if (profile.skinType) setSkinType(profile.skinType);
          if (profile.skinConcerns) setSkinConcerns(profile.skinConcerns);
        }
      } finally {
        setFetching(false);
      }
    };
    void loadProfile();
  }, []);

  const handleSave = async () => {
    if (!age || !gender || !skinType) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }
    const ageNum = parseInt(age);
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert("Validation Error", "Please enter a valid age (13-120)");
      return;
    }
    setLoading(true);
    try {
      await createOrUpdateUserProfile({ age: ageNum, gender, skinType, skinConcerns });
      Alert.alert("Success", "Your profile has been updated!", [{ text: "OK", onPress: () => router.replace("/dashboard/home") }]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <MotionView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Skin Profile</Text>
      </MotionView>

      <MotionView delay={50} style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender *</Text>
          <View style={styles.optionsGrid}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, gender === option && styles.optionButtonActive]}
                onPress={() => setGender(option)}
                disabled={loading}
              >
                <Text style={[styles.optionText, gender === option && styles.optionTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skin Type *</Text>
          <View style={styles.optionsColumn}>
            {skinTypeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.radioButton, skinType === option && styles.radioButtonActive]}
                onPress={() => setSkinType(option)}
                disabled={loading}
              >
                <View style={styles.radioCircle}>{skinType === option && <View style={styles.radioInner} />}</View>
                <Text style={styles.radioLabel}>{option.charAt(0).toUpperCase() + option.slice(1)} Skin</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Skin Concerns</Text>
          <Text style={styles.helperText}>Select all that apply</Text>
          <View style={styles.concernsGrid}>
            {concernsOptions.map((concern) => (
              <TouchableOpacity
                key={concern}
                style={[styles.concernTag, skinConcerns.includes(concern) && styles.concernTagActive]}
                onPress={() =>
                  setSkinConcerns((prev) =>
                    prev.includes(concern) ? prev.filter((item) => item !== concern) : [...prev, concern],
                  )
                }
                disabled={loading}
              >
                <Ionicons
                  name={skinConcerns.includes(concern) ? "checkmark-circle" : "add-circle-outline"}
                  size={18}
                  color={skinConcerns.includes(concern) ? colors.primary : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.concernText, skinConcerns.includes(concern) && styles.concernTextActive]}>
                  {concern}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Profile Summary</Text>
          <Text style={styles.summaryText}>Age: {age || "Not set"}</Text>
          <Text style={styles.summaryText}>Gender: {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Not set"}</Text>
          <Text style={styles.summaryText}>Skin Type: {skinType ? skinType.charAt(0).toUpperCase() + skinType.slice(1) : "Not set"}</Text>
          <Text style={styles.summaryText}>Concerns: {skinConcerns.length || "None selected"}</Text>
        </View>
      </MotionView>

      <MotionView delay={100} style={styles.footer}>
        <PrimaryButton title={loading ? "Saving..." : "Save Profile"} onPress={handleSave} disabled={loading} />
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </MotionView>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.l, paddingTop: SPACING.xl, paddingBottom: SPACING.m },
    headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.text, marginLeft: SPACING.m },
    content: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl },
    section: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: SPACING.m },
    helperText: { fontSize: 13, color: colors.textSecondary, marginBottom: SPACING.m },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, fontSize: 16, color: colors.text, backgroundColor: colors.surface },
    optionsGrid: { flexDirection: "row", gap: SPACING.m, justifyContent: "space-between" },
    optionsColumn: { gap: SPACING.m },
    optionButton: { flex: 1, paddingVertical: SPACING.m, paddingHorizontal: SPACING.m, borderWidth: 2, borderColor: colors.border, borderRadius: RADIUS.m, alignItems: "center", backgroundColor: colors.surface },
    optionButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionText: { fontSize: 14, fontWeight: "500", color: colors.text },
    optionTextActive: { color: "#FFF" },
    radioButton: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.m, paddingHorizontal: SPACING.m, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, backgroundColor: colors.surface },
    radioButtonActive: { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: SPACING.m },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioLabel: { fontSize: 15, color: colors.text, fontWeight: "500" },
    concernsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.m },
    concernTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.l, backgroundColor: colors.surface },
    concernTagActive: { backgroundColor: colors.primary + "20", borderColor: colors.primary },
    concernText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
    concernTextActive: { color: colors.primary },
    summaryCard: { backgroundColor: colors.primary + "10", borderRadius: RADIUS.m, padding: SPACING.m, marginBottom: SPACING.xl, borderLeftWidth: 4, borderLeftColor: colors.primary },
    summaryTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: SPACING.s },
    summaryText: { fontSize: 13, color: colors.textSecondary, marginBottom: SPACING.s },
    footer: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl, gap: SPACING.m },
    skipText: { textAlign: "center", fontSize: 14, color: colors.textSecondary, marginTop: SPACING.m },
  });
