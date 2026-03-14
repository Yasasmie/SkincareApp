import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MotionView } from "../../components/MotionView";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { deleteAnalysis, getAnalysisStats, getUserAnalysisHistory, type SkinAnalysis } from "../../services/analysisHistoryService";

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SkinAnalysis | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [allAnalyses, statsData] = await Promise.all([getUserAnalysisHistory(100), getAnalysisStats()]);
      setAnalyses(allAnalyses);
      setStats(statsData);
    } catch {
      Alert.alert("Error", "Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { void loadHistory(); }, []));

  const getSeverityColor = (score: number) => (score > 70 ? "#51CF66" : score > 40 ? "#FFA500" : colors.error);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedAnalysis) {
    return (
      <ScrollView style={styles.container}>
        <MotionView style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedAnalysis(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Details</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Delete Analysis", "Are you sure you want to delete this analysis?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    await deleteAnalysis(selectedAnalysis.id || "");
                    setSelectedAnalysis(null);
                    await loadHistory();
                  },
                },
              ])
            }
          >
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        </MotionView>

        <MotionView delay={50} style={styles.detailContent}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{new Date(selectedAnalysis.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Health Score</Text>
            <View style={styles.scoreLargeContainer}>
              <View style={[styles.scoreLargeCircle, { borderColor: getSeverityColor(selectedAnalysis.healthScore) }]}>
                <Text style={[styles.scoreLargeText, { color: getSeverityColor(selectedAnalysis.healthScore) }]}>{selectedAnalysis.healthScore}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Detected Conditions</Text>
            {selectedAnalysis.detectedConditions.map((condition, i) => (
              <View key={i} style={styles.conditionItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: SPACING.m }}>
                  <Text style={styles.conditionItemText}>{condition}</Text>
                  <Text style={styles.confidenceText}>{selectedAnalysis.confidenceScores[i] ? `${selectedAnalysis.confidenceScores[i]}% confidence` : "No confidence data"}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push(`/camera/results?predictions=${JSON.stringify({ predictions: selectedAnalysis.detectedConditions.map((c, i) => ({ class: c, confidence: (selectedAnalysis.confidenceScores[i] || 50) / 100 })) })}`)
              }
            >
              <Ionicons name="eye" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>View Routine</Text>
            </TouchableOpacity>
          </View>
        </MotionView>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <MotionView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <TouchableOpacity onPress={loadHistory}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </MotionView>
      {stats && (
        <MotionView delay={50} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.totalAnalyses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{stats.recentAnalyses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: getSeverityColor(stats.averageHealthScore) }]}>{stats.averageHealthScore}</Text>
          </View>
        </MotionView>
      )}
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id || ""}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedAnalysis(item)}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.cardConditions}>{item.detectedConditions.length} conditions</Text>
              </View>
              <View style={[styles.scoreCircle, { borderColor: getSeverityColor(item.healthScore) }]}>
                <Text style={styles.scoreText}>{item.healthScore}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No analysis history yet</Text>
            <Text style={styles.emptySubtext}>Start by capturing a photo to analyze your skin</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.l, paddingTop: SPACING.l, paddingBottom: SPACING.m },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    statsContainer: { flexDirection: "row", paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, gap: SPACING.m },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: RADIUS.m, padding: SPACING.m, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: SPACING.s },
    statValue: { fontSize: 20, fontWeight: "bold", color: colors.primary },
    listContent: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl },
    card: { backgroundColor: colors.surface, borderRadius: RADIUS.m, padding: SPACING.m, marginBottom: SPACING.m, borderLeftWidth: 4, borderLeftColor: colors.primary, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardDate: { fontSize: 14, fontWeight: "600", color: colors.text },
    cardConditions: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    scoreCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, justifyContent: "center", alignItems: "center" },
    scoreText: { fontSize: 16, fontWeight: "bold", color: colors.primary },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 100 },
    emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: SPACING.m },
    emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: SPACING.s, textAlign: "center", maxWidth: 250 },
    detailContent: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl },
    detailSection: { marginBottom: SPACING.xl },
    detailLabel: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: SPACING.m },
    detailValue: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    scoreLargeContainer: { alignItems: "center", paddingVertical: SPACING.xl },
    scoreLargeCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, justifyContent: "center", alignItems: "center" },
    scoreLargeText: { fontSize: 40, fontWeight: "bold" },
    conditionItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: SPACING.m, borderBottomWidth: 1, borderBottomColor: colors.border },
    conditionItemText: { fontSize: 15, fontWeight: "500", color: colors.text },
    confidenceText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    actionButtons: { flexDirection: "row", gap: SPACING.m, marginTop: SPACING.xl },
    actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "20", borderRadius: RADIUS.m, paddingVertical: SPACING.m, gap: SPACING.s },
    actionButtonText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  });
