import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { saveAnalysis } from "../../services/analysisHistoryService";
import { calculateHealthScore, getRecommendation, normalizeDetectedCondition } from "../../services/diseaseRoutineService";
import type { RoboflowResponse } from "../../services/roboflowService";

type StoredAnalysis = { imageUri?: string; predictions?: RoboflowResponse };

export default function ResultsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { imageUri, predictions } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<"morning" | "evening" | "weekly">("morning");
  const [saving, setSaving] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [parsed, setParsed] = useState<RoboflowResponse | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [resolvedImageUri, setResolvedImageUri] = useState<string | null>(typeof imageUri === "string" ? imageUri : null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      let responseData: RoboflowResponse | null = null;
      let fallbackImageUri: string | null = null;

      if (typeof predictions === "string" && predictions.trim().length > 0) {
        try {
          responseData = JSON.parse(predictions) as RoboflowResponse;
        } catch (error) {
          console.error("[Results] Failed to parse route predictions:", error);
        }
      }

      if (!responseData) {
        try {
          const raw = await AsyncStorage.getItem("lastAnalysis");
          if (raw) {
            const stored = JSON.parse(raw) as StoredAnalysis;
            responseData = stored.predictions || null;
            fallbackImageUri = stored.imageUri || null;
          }
        } catch (error) {
          console.warn("[Results] Failed to read lastAnalysis from AsyncStorage", error);
        }
      }

      if (!responseData) {
        if (mounted) {
          setParsed(null);
          setRecommendations([]);
          setHealthScore(100);
        }
        return;
      }

      const boxes = responseData.predictions || [];
      const diseaseNames = boxes.map((box) => normalizeDetectedCondition(box.class));
      const confidences = boxes.map((box) => Math.round((box.confidence || 0) * 100));
      const recs = diseaseNames.map((disease) => getRecommendation(disease));

      if (mounted) {
        setParsed(responseData);
        setRecommendations(recs);
        setHealthScore(calculateHealthScore(diseaseNames, confidences));
        setResolvedImageUri((currentImageUri) => currentImageUri || fallbackImageUri);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [imageUri, predictions]);

  const boxes = parsed?.predictions || [];
  const primaryRecommendation = recommendations[0] || getRecommendation("healthy");
  const currentRoutine = primaryRecommendation.routines.find((routine: any) => routine.phase === selectedTab);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return colors.error;
      case "medium":
        return "#FFA500";
      case "low":
        return "#51CF66";
      default:
        return colors.primary;
    }
  };

  const handleSaveToHistory = async () => {
    setSaving(true);
    try {
      const detectedConditions = boxes.map((box) => normalizeDetectedCondition(box.class));
      const confidenceScores = boxes.map((box) => Math.round((box.confidence || 0) * 100));

      await saveAnalysis({
        detectedConditions,
        confidenceScores,
        healthScore,
        recommendations,
        saved: true,
      });

      Alert.alert("Saved Successfully", "Your skin analysis has been saved to your history. You will be taken back to the home page.", [
        { text: "OK", onPress: () => router.replace("/dashboard/home") },
      ]);
    } catch (error: any) {
      Alert.alert("Save Failed", `Could not save analysis: ${error?.message || "Unknown error"}`, [{ text: "OK" }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {resolvedImageUri && !imageLoadError && (
        <Image
          source={{ uri: resolvedImageUri }}
          style={styles.imageHeader}
          onError={() => setImageLoadError(true)}
        />
      )}

      <View style={styles.content}>
        <MotionView style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Skin Health Score</Text>
          <View style={[styles.scoreCircle, { borderColor: getSeverityColor(healthScore > 70 ? "low" : healthScore > 40 ? "medium" : "high") }]}>
            <Text style={styles.scoreNumber}>{healthScore}</Text>
          </View>
          <Text style={styles.scoreText}>
            {boxes.length === 0 ? "Your skin looks great!" : `${boxes.length} condition${boxes.length > 1 ? "s" : ""} detected`}
          </Text>
        </MotionView>

        {boxes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detected Conditions</Text>
            <View style={styles.conditionsContainer}>
              {recommendations.map((rec, index) => (
                <MotionView key={`${rec.disease}-${index}`} delay={index * 100} style={styles.conditionCard}>
                  <View style={styles.conditionHeader}>
                    <View style={[styles.severityDot, { backgroundColor: getSeverityColor(rec.severity) }]} />
                    <View style={styles.conditionBody}>
                      <Text style={styles.diseaseName}>{rec.disease}</Text>
                      <Text style={styles.confidenceText}>{Math.round((boxes[index]?.confidence || 0) * 100)}% confidence</Text>
                    </View>
                  </View>
                  <Text style={styles.diseaseDescription}>{rec.description}</Text>
                </MotionView>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Your Skincare Routine</Text>

        <View style={styles.tabContainer}>
          {(["morning", "evening", "weekly"] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)} style={[styles.tab, selectedTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <MotionView delay={200} style={styles.routineContainer}>
          {currentRoutine?.steps.map((step: string, index: number) => (
            <View key={`${selectedTab}-${index}`} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </MotionView>

        {primaryRecommendation.avoid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Products to Avoid</Text>
            <MotionView delay={300} style={styles.avoidContainer}>
              {primaryRecommendation.avoid.map((item: string, index: number) => (
                <View key={`avoid-${index}`} style={styles.avoidItem}>
                  <Ionicons name="close-circle" size={18} color={colors.error} />
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </MotionView>
          </>
        )}

        {primaryRecommendation.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <MotionView delay={400} style={styles.tipsContainer}>
              {primaryRecommendation.tips.map((tip: string, index: number) => (
                <View key={`tip-${index}`} style={styles.tipItem}>
                  <Ionicons name="star" size={18} color={colors.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </MotionView>
          </>
        )}

        <View style={styles.actions}>
          <PrimaryButton title={saving ? "Saving..." : "Save to History"} onPress={handleSaveToHistory} disabled={saving} />
          <TouchableOpacity style={styles.rescanBtn} onPress={() => router.replace("/camera/capture")}>
            <Ionicons name="camera-reverse-outline" size={20} color={colors.text} />
            <Text style={styles.rescanBtnText}>Rescan</Text>
          </TouchableOpacity>
          {primaryRecommendation.consult && (
            <TouchableOpacity
              style={styles.expertBtn}
              onPress={() =>
                Alert.alert("Dermatologist Consultation", "Based on the detected condition(s), we recommend consulting a dermatologist for professional advice.", [{ text: "OK" }])
              }
            >
              <Ionicons name="medical" size={20} color={colors.primary} />
              <Text style={styles.expertBtnText}>Consult a Dermatologist</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    imageHeader: { width: "100%", height: 250, resizeMode: "cover" },
    content: {
      backgroundColor: colors.background,
      marginTop: -20,
      borderTopLeftRadius: RADIUS.l,
      borderTopRightRadius: RADIUS.l,
      padding: SPACING.l,
      paddingTop: SPACING.xl,
    },
    scoreCard: { alignItems: "center", marginBottom: SPACING.xl },
    scoreLabel: { fontSize: 14, color: colors.textLight, marginBottom: SPACING.s },
    scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 5, justifyContent: "center", alignItems: "center", marginBottom: SPACING.s },
    scoreNumber: { fontSize: 40, fontWeight: "bold", color: colors.primary },
    scoreText: { fontSize: 16, fontWeight: "600", color: colors.text },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: SPACING.l, marginBottom: SPACING.m },
    conditionsContainer: { marginBottom: SPACING.l },
    conditionCard: { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: colors.primary, padding: SPACING.m, borderRadius: RADIUS.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: colors.border },
    conditionHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.s },
    severityDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.s },
    conditionBody: { flex: 1 },
    diseaseName: { fontSize: 16, fontWeight: "700", color: colors.text },
    confidenceText: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    diseaseDescription: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
    tabContainer: { flexDirection: "row", backgroundColor: colors.card, borderRadius: RADIUS.m, padding: 4, marginBottom: SPACING.l, borderWidth: 1, borderColor: colors.border },
    tab: { flex: 1, paddingVertical: SPACING.s, alignItems: "center", borderRadius: RADIUS.s },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: "600", color: colors.textLight },
    tabTextActive: { color: "#FFF" },
    routineContainer: { backgroundColor: colors.card, borderRadius: RADIUS.m, padding: SPACING.l, marginBottom: SPACING.l, borderWidth: 1, borderColor: colors.border },
    stepItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.m },
    stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginRight: SPACING.m },
    stepNumberText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
    stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
    avoidContainer: { backgroundColor: colors.error + "15", borderRadius: RADIUS.m, padding: SPACING.l, marginBottom: SPACING.l, borderLeftWidth: 4, borderLeftColor: colors.error },
    avoidItem: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.m },
    avoidText: { flex: 1, fontSize: 14, color: colors.text, marginLeft: SPACING.s, fontWeight: "500" },
    tipsContainer: { backgroundColor: colors.primary + "12", borderRadius: RADIUS.m, padding: SPACING.l, marginBottom: SPACING.l, borderLeftWidth: 4, borderLeftColor: colors.primary },
    tipItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.m },
    tipText: { flex: 1, fontSize: 14, color: colors.text, marginLeft: SPACING.s, lineHeight: 20 },
    actions: { marginTop: SPACING.l },
    rescanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, padding: SPACING.m, marginTop: SPACING.m },
    rescanBtnText: { color: colors.text, fontWeight: "600", marginLeft: SPACING.s },
    expertBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary, borderRadius: RADIUS.m, padding: SPACING.m, marginTop: SPACING.m },
    expertBtnText: { color: colors.primary, fontWeight: "600", marginLeft: SPACING.s },
  });
