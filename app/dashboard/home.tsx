import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import {
  getUserAnalysisHistory,
  SkinAnalysis,
} from "../../services/analysisHistoryService";
import { getRoutineStepsForPhase } from "../../services/diseaseRoutineService";
import { getUserProfileSafe } from "../../services/firebaseUserService";

function getSafeProfilePhoto(photo: string | null | undefined): string | null {
  if (!photo) {
    return null;
  }

  if (photo.startsWith("blob:")) {
    return null;
  }

  return photo;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [userName, setUserName] = useState("User");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Good Morning");
  const [lastRoutineSteps, setLastRoutineSteps] = useState<string[] | null>(
    null,
  );
  const [lastCondition, setLastCondition] = useState<string | null>(null);
  const [routinePhase, setRoutinePhase] = useState<"morning" | "evening">(
    "morning",
  );
  const [lastHealthScore, setLastHealthScore] = useState<number | null>(null);
  const [lastRecommendations, setLastRecommendations] = useState<any[] | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        const phase: "morning" | "evening" = hour < 12 ? "morning" : "evening";
        setRoutinePhase(phase);
        setUserName(user.displayName || "User");

        try {
          const profile = await getUserProfileSafe();
          if (profile.name) setUserName(profile.name);
          setUserPhoto(
            getSafeProfilePhoto(profile.photoURL) ||
              getSafeProfilePhoto(profile.photoData) ||
              null,
          );
        } catch (error) {
          console.warn("[Home] Error fetching user data:", error);
        }

        try {
          const analyses = await getUserAnalysisHistory(1);
          if (analyses && analyses.length > 0) {
            const last = analyses[0] as SkinAnalysis;
            const cond =
              last.detectedConditions && last.detectedConditions.length > 0
                ? last.detectedConditions[0]
                : "healthy";
            setLastCondition(cond);
            setLastRoutineSteps(getRoutineStepsForPhase(last.detectedConditions || [], phase));
            setLastHealthScore(last.healthScore ?? null);
            setLastRecommendations(last.recommendations || null);
          } else {
            setLastCondition("healthy");
            setLastRoutineSteps(getRoutineStepsForPhase([], phase));
          }
        } catch (error) {
          console.warn("[Home] Error loading last analysis:", error);
        }
      };

      void fetchData();
    }, []),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.username}>{userName}</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/dashboard/profile")}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <MotionView delay={100}>
        <Text style={styles.sectionTitle}>Your Skin Health</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {lastHealthScore === null
                  ? "Unknown"
                  : lastHealthScore > 70
                    ? "Hydrated"
                    : lastHealthScore > 40
                      ? "Needs Attention"
                      : "Concerning"}
              </Text>
            </View>
          </View>
          <Text style={styles.statusBig}>{lastHealthScore ?? "--"}%</Text>
          <Text style={styles.statusDesc}>
            {lastHealthScore === null
              ? "No recent analysis. Tap Analyze Skin to generate a routine."
              : lastHealthScore > 70
                ? "Your skin is looking good. Keep following your routine."
                : lastHealthScore > 40
                  ? "Some care needed - follow the recommended routine."
                  : "Consider consulting a dermatologist and follow immediate care."}
          </Text>
        </View>
      </MotionView>

      <MotionView delay={150}>
        <Text style={styles.sectionTitle}>Today&apos;s Routine</Text>
        <View style={styles.routineCard}>
          <Text style={styles.routineTitle}>
            {routinePhase === "morning" ? "Morning" : "Evening"} routine -{" "}
            {lastCondition || "General"}
          </Text>
          {lastRoutineSteps && lastRoutineSteps.length > 0 ? (
            <View style={{ marginTop: SPACING.s }}>
              {lastRoutineSteps.map((step, idx) => (
                <Text key={idx} style={styles.routineStep}>
                  {idx + 1}. {step}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyRoutine}>
              No recent routine available. Analyze your skin to generate a routine.
            </Text>
          )}
        </View>
      </MotionView>

      <MotionView delay={200} style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => router.push("/camera/capture")}
        >
          <Ionicons name="camera" size={32} color="#FFF" />
          <Text style={styles.cameraButtonText}>Analyze Skin</Text>
        </TouchableOpacity>

        <View style={styles.sideColumn}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.secondary }]}
            activeOpacity={0.9}
          >
            <View style={styles.cardIcon}>
              <Ionicons
                name={routinePhase === "morning" ? "sunny" : "moon"}
                size={24}
                color={colors.text}
              />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                {routinePhase === "morning" ? "Morning Routine" : "Evening Routine"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {lastCondition ? lastCondition : "General maintenance"}
              </Text>
              {lastRoutineSteps && lastRoutineSteps.length > 0 && (
                <View style={{ marginTop: SPACING.s }}>
                  <Text style={styles.cardSubtitle}>{`${lastRoutineSteps.length} steps`}</Text>
                  <Text style={[styles.cardSubtitle, { marginTop: 4 }]} numberOfLines={2}>
                    {lastRoutineSteps.slice(0, 2).join(" • ")}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ height: SPACING.m }} />

          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
            onPress={() => router.push("/dashboard/products")}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="flask" size={24} color={colors.text} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Products</Text>
              <Text style={styles.cardSubtitle}>View last analysis products</Text>
              {lastRecommendations && lastRecommendations.length > 0 && (
                <Text
                  style={[styles.cardSubtitle, { marginTop: SPACING.s }]}
                  numberOfLines={2}
                >
                  {lastRecommendations[0]?.disease || "Recent analysis"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </MotionView>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.l,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: SPACING.xl,
      marginBottom: SPACING.l,
    },
    greeting: { fontSize: 16, color: colors.textLight },
    username: { fontSize: 24, fontWeight: "bold", color: colors.text },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#FFF",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: SPACING.m,
    },
    statusCard: {
      backgroundColor: colors.primary,
      padding: SPACING.l,
      borderRadius: RADIUS.l,
      marginBottom: SPACING.l,
    },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
    badge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    badgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
    statusBig: {
      fontSize: 48,
      fontWeight: "bold",
      color: "#FFF",
      marginVertical: SPACING.s,
    },
    statusDesc: { color: "#FFF", opacity: 0.9, lineHeight: 20 },
    routineCard: {
      backgroundColor: colors.surface,
      padding: SPACING.l,
      borderRadius: RADIUS.l,
      marginBottom: SPACING.l,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routineTitle: { fontWeight: "700", color: colors.text },
    routineStep: { color: colors.text, marginTop: 6 },
    emptyRoutine: { color: colors.textLight, marginTop: SPACING.s },
    actionsGrid: { flexDirection: "row" },
    cameraButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.l,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    cameraButtonText: { color: "#FFF", marginTop: SPACING.s, fontWeight: "600" },
    sideColumn: { flex: 1, marginLeft: SPACING.m },
    card: {
      padding: SPACING.m,
      borderRadius: RADIUS.m,
      justifyContent: "space-between",
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardIcon: { marginBottom: SPACING.s, alignSelf: "flex-start" },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.textLight },
  });
