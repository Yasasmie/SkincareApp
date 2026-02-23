// app/dashboard/products.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { getUserAnalysisHistory } from "../../services/analysisHistoryService";
import { getRecommendation } from "../../services/diseaseRoutineService";

export default function ProductsScreen() {
  const router = useRouter();
  const [primaryRec, setPrimaryRec] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const analyses = await getUserAnalysisHistory(1);
        if (!mounted) return;
        if (analyses && analyses.length > 0) {
          const last = analyses[0];
          const primaryDisease =
            last.detectedConditions && last.detectedConditions.length > 0
              ? last.detectedConditions[0]
              : "healthy";
          const rec = getRecommendation(primaryDisease);
          setPrimaryRec(rec);
        } else {
          setPrimaryRec(getRecommendation("healthy"));
        }
      } catch (err) {
        console.warn("[Products] Failed to load last analysis:", err);
        setPrimaryRec(getRecommendation("healthy"));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: SPACING.l }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Products from Last Analysis</Text>
      </View>

      <MotionView delay={100}>
        <Text style={styles.sectionTitle}>Products to Avoid</Text>
        <View style={styles.card}>
          {primaryRec && primaryRec.avoid && primaryRec.avoid.length > 0 ? (
            primaryRec.avoid.map((item: string, idx: number) => (
              <View key={idx} style={styles.avoidItem}>
                <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                <Text style={styles.avoidText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No products to avoid detected.</Text>
          )}
        </View>
      </MotionView>

      <MotionView delay={200}>
        <Text style={styles.sectionTitle}>Pro Tips</Text>
        <View style={styles.card}>
          {primaryRec && primaryRec.tips && primaryRec.tips.length > 0 ? (
            primaryRec.tips.map((tip: string, idx: number) => (
              <View key={idx} style={styles.tipItem}>
                <Ionicons name="star" size={18} color={COLORS.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tips available.</Text>
          )}
        </View>
      </MotionView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  backBtn: { padding: SPACING.s, marginRight: SPACING.s },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
  },
  avoidItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  avoidText: { marginLeft: SPACING.s, color: COLORS.text },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  tipText: { marginLeft: SPACING.s, color: COLORS.text },
  emptyText: { color: COLORS.textLight },
});
