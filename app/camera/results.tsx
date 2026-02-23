// app/camera/results.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { saveAnalysis } from "../../services/analysisHistoryService";
import {
    calculateHealthScore,
    getRecommendation,
} from "../../services/diseaseRoutineService";
import type { RoboflowResponse } from "../../services/roboflowService";

export default function ResultsScreen() {
  const router = useRouter();
  const { imageUri, predictions } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<
    "morning" | "evening" | "weekly"
  >("morning");
  const [saving, setSaving] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // State for parsed data and derived recommendations
  const [parsed, setParsed] = useState<RoboflowResponse | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(100);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      console.log("[Results] Received predictions:", predictions);

      let source: string | null = predictions as string | null;
      if (!source) {
        // Try AsyncStorage fallback
        try {
          const raw = await AsyncStorage.getItem("lastAnalysis");
          if (raw) {
            const parsedRaw = JSON.parse(raw);
            if (parsedRaw?.predictions) {
              source = JSON.stringify(parsedRaw);
              console.log(
                "[Results] Loaded predictions from AsyncStorage fallback",
              );
            }
          }
        } catch (err) {
          console.warn(
            "[Results] Failed to read lastAnalysis from AsyncStorage",
            err,
          );
        }
      }

      if (!source) {
        console.log("[Results] No predictions provided or found in storage");
        if (mounted) {
          setParsed(null);
          setRecommendations([]);
          setHealthScore(100);
        }
        return;
      }

      try {
        const data = JSON.parse(source) as RoboflowResponse;
        console.log("[Results] Parsed data:", data);
        const boxes = data.predictions || [];
        console.log("[Results] Predictions array:", boxes);

        const diseaseNames = boxes.map((b) => b.class);
        const confidences = boxes.map((b) => b.confidence);
        console.log("[Results] Disease names:", diseaseNames);
        console.log("[Results] Confidences:", confidences);

        const score = calculateHealthScore(diseaseNames, confidences);
        console.log("[Results] Calculated health score:", score);

        const recs = diseaseNames.map((disease) => getRecommendation(disease));
        console.log("[Results] Recommendations count:", recs.length);

        if (mounted) {
          setParsed(data);
          setRecommendations(recs);
          setHealthScore(score);
        }
      } catch (e) {
        console.error("[Results] Failed to parse predictions:", e);
        console.error("[Results] Predictions string was:", predictions);
        if (mounted) {
          setParsed(null);
          setRecommendations([]);
          setHealthScore(100);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [predictions]);

  const boxes = parsed?.predictions || [];
  const primaryRecommendation =
    recommendations[0] || getRecommendation("healthy");
  const currentRoutine = primaryRecommendation.routines.find(
    (r: any) => r.phase === selectedTab,
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#FF6B6B";
      case "medium":
        return "#FFA500";
      case "low":
        return "#51CF66";
      default:
        return COLORS.primary;
    }
  };

  const handleSaveToHistory = async () => {
    if (boxes.length === 0) {
      Alert.alert("Info", "No conditions detected to save.");
      return;
    }

    setSaving(true);
    try {
      console.log("[Results] Saving analysis to history...");
      const detectedConditions = boxes.map((b) => b.class.toLowerCase());
      const confidenceScores = boxes.map((b) =>
        Math.round((b.confidence || 0) * 100),
      );

      const analysisId = await saveAnalysis({
        detectedConditions,
        confidenceScores,
        healthScore,
        recommendations,
        saved: true,
      });

      console.log("[Results] Analysis saved with ID:", analysisId);
      Alert.alert(
        "✅ Saved Successfully!",
        "Your skin analysis has been saved to your history.",
        [
          {
            text: "View History",
            onPress: () => router.replace("/dashboard/history"),
          },
          {
            text: "Back to Home",
            onPress: () => router.replace("/dashboard/home"),
          },
        ],
      );
    } catch (error: any) {
      console.error("[Results] Error saving analysis:", error);
      Alert.alert(
        "Save Failed",
        `Could not save analysis: ${error?.message || "Unknown error"}`,
        [{ text: "OK" }],
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {imageUri && !imageLoadError && (
        <Image
          source={{ uri: imageUri as string }}
          style={styles.imageHeader}
          onError={() => {
            console.warn("[Results] Image failed to load from URI");
            setImageLoadError(true);
          }}
        />
      )}

      <View style={styles.content}>
        {/* Health Score Card */}
        <MotionView style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Skin Health Score</Text>
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor: getSeverityColor(
                  healthScore > 70
                    ? "low"
                    : healthScore > 40
                      ? "medium"
                      : "high",
                ),
              },
            ]}
          >
            <Text style={styles.scoreNumber}>{healthScore}</Text>
          </View>
          <Text style={styles.scoreText}>
            {boxes.length === 0
              ? "✓ Your skin looks great!"
              : `${boxes.length} condition${boxes.length > 1 ? "s" : ""} detected`}
          </Text>
        </MotionView>

        {/* Detected Conditions */}
        {boxes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detected Conditions</Text>
            <View style={styles.conditionsContainer}>
              {recommendations.map((rec, index) => (
                <MotionView
                  key={index}
                  delay={index * 100}
                  style={styles.conditionCard}
                >
                  <View style={styles.conditionHeader}>
                    <View
                      style={[
                        styles.severityDot,
                        { backgroundColor: getSeverityColor(rec.severity) },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diseaseName}>{rec.disease}</Text>
                      <Text style={styles.confidenceText}>
                        {Math.round((boxes[index]?.confidence || 0) * 100)}%
                        confidence
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.diseaseDescription}>
                    {rec.description}
                  </Text>
                </MotionView>
              ))}
            </View>
          </>
        )}

        {/* Personalized Routine */}
        <Text style={styles.sectionTitle}>Your Skincare Routine</Text>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          {(["morning", "evening", "weekly"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Routine Steps */}
        <MotionView delay={200} style={styles.routineContainer}>
          {currentRoutine?.steps.map((step: string, index: number) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </MotionView>

        {/* Avoid List */}
        {primaryRecommendation.avoid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Products to Avoid</Text>
            <MotionView delay={300} style={styles.avoidContainer}>
              {primaryRecommendation.avoid.map(
                (item: string, index: number) => (
                  <View key={index} style={styles.avoidItem}>
                    <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                    <Text style={styles.avoidText}>{item}</Text>
                  </View>
                ),
              )}
            </MotionView>
          </>
        )}

        {/* Tips */}
        {primaryRecommendation.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <MotionView delay={400} style={styles.tipsContainer}>
              {primaryRecommendation.tips.map((tip: string, index: number) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="star" size={18} color={COLORS.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </MotionView>
          </>
        )}

        {/* Action Buttons */}
        <View style={{ marginTop: SPACING.l }}>
          <PrimaryButton
            title={saving ? "Saving..." : "Save to History"}
            onPress={handleSaveToHistory}
            disabled={saving}
          />
          {primaryRecommendation.consult && (
            <TouchableOpacity
              style={styles.expertBtn}
              onPress={() =>
                Alert.alert(
                  "Dermatologist Consultation",
                  "Based on the detected condition(s), we recommend consulting a dermatologist for professional advice.",
                  [{ text: "OK" }],
                )
              }
            >
              <Ionicons name="medical" size={20} color={COLORS.primary} />
              <Text style={styles.expertBtnText}>Consult a Dermatologist</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageHeader: { width: "100%", height: 250, resizeMode: "cover" },
  content: {
    backgroundColor: COLORS.background,
    marginTop: -20,
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
    padding: SPACING.l,
    paddingTop: SPACING.xl,
  },

  scoreCard: { alignItems: "center", marginBottom: SPACING.xl },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.s,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  scoreNumber: { fontSize: 40, fontWeight: "bold", color: COLORS.primary },
  scoreText: { fontSize: 16, fontWeight: "600", color: COLORS.text },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },

  conditionsContainer: { marginBottom: SPACING.l },
  conditionCard: {
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    marginBottom: SPACING.m,
    elevation: 2,
  },
  conditionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.s,
  },
  diseaseName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  confidenceText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  diseaseDescription: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    padding: 4,
    marginBottom: SPACING.l,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.s,
    alignItems: "center",
    borderRadius: RADIUS.s,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: "#FFF",
  },

  routineContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    elevation: 2,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.m,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  stepNumberText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  avoidContainer: {
    backgroundColor: "#FFE5E5",
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  avoidItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  avoidText: {
    flex: 1,
    fontSize: 14,
    color: "#C41E3A",
    marginLeft: SPACING.s,
    fontWeight: "500",
  },

  tipsContainer: {
    backgroundColor: "#F0F9FF",
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.m,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.s,
    lineHeight: 20,
  },

  expertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginTop: SPACING.m,
  },
  expertBtnText: {
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: SPACING.s,
  },
});
