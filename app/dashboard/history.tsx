// app/dashboard/history.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
    deleteAnalysis,
    getAnalysisStats,
    getUserAnalysisHistory,
    type SkinAnalysis,
} from "../../services/analysisHistoryService";

export default function HistoryScreen() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SkinAnalysis | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");

  // Load history
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log("[History] Loading user analysis history...");
      const [allAnalyses, statsData] = await Promise.all([
        getUserAnalysisHistory(100),
        getAnalysisStats(),
      ]);

      console.log("[History] Loaded analyses:", allAnalyses.length);
      console.log("[History] Stats:", statsData);
      setAnalyses(allAnalyses);
      setStats(statsData);
    } catch (error) {
      console.error("[History] Error loading history:", error);
      Alert.alert("Error", "Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    Alert.alert(
      "Delete Analysis",
      "Are you sure you want to delete this analysis?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnalysis(analysisId);
              await loadHistory();
              setSelectedAnalysis(null);
            } catch (error) {
              Alert.alert("Error", "Failed to delete analysis");
            }
          },
        },
      ],
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getSeverityColor = (score: number) => {
    if (score > 70) return "#51CF66"; // Good
    if (score > 40) return "#FFA500"; // Fair
    return "#FF6B6B"; // Poor
  };

  const AnalysisCard = ({ analysis }: { analysis: SkinAnalysis }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedAnalysis(analysis)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardDate}>{formatDate(analysis.createdAt)}</Text>
          <Text style={styles.cardConditions}>
            {analysis.detectedConditions.length} condition
            {analysis.detectedConditions.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View
          style={[
            styles.scoreCircle,
            {
              borderColor: getSeverityColor(analysis.healthScore),
            },
          ]}
        >
          <Text style={styles.scoreText}>{analysis.healthScore}</Text>
        </View>
      </View>

      <View style={styles.conditionsList}>
        {analysis.detectedConditions.slice(0, 3).map((cond, i) => (
          <View key={i} style={styles.conditionBadge}>
            <Text style={styles.conditionBadgeText}>{cond}</Text>
          </View>
        ))}
        {analysis.detectedConditions.length > 3 && (
          <View style={styles.moreBadge}>
            <Text style={styles.moreBadgeText}>
              +{analysis.detectedConditions.length - 3}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedAnalysis ? (
        // Detail View
        <ScrollView style={styles.container}>
          <MotionView style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedAnalysis(null)}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analysis Details</Text>
            <TouchableOpacity
              onPress={() => handleDeleteAnalysis(selectedAnalysis.id || "")}
            >
              <Ionicons name="trash" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </MotionView>

          <MotionView delay={50} style={styles.detailContent}>
            {/* Date */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedAnalysis.createdAt).toLocaleString()}
              </Text>
            </View>

            {/* Health Score */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Health Score</Text>
              <View style={styles.scoreLargeContainer}>
                <View
                  style={[
                    styles.scoreLargeCircle,
                    {
                      borderColor: getSeverityColor(
                        selectedAnalysis.healthScore,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreLargeText,
                      {
                        color: getSeverityColor(selectedAnalysis.healthScore),
                      },
                    ]}
                  >
                    {selectedAnalysis.healthScore}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detected Conditions */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Detected Conditions</Text>
              {selectedAnalysis.detectedConditions.map((condition, i) => (
                <View key={i} style={styles.conditionItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.primary}
                  />
                  <View style={{ flex: 1, marginLeft: SPACING.m }}>
                    <Text style={styles.conditionItemText}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </Text>
                    <Text style={styles.confidenceText}>
                      {selectedAnalysis.confidenceScores[i]
                        ? `${selectedAnalysis.confidenceScores[i]}% confidence`
                        : "No confidence data"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Notes */}
            {selectedAnalysis.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selectedAnalysis.notes}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(
                    `/camera/results?predictions=${JSON.stringify({
                      predictions: selectedAnalysis.detectedConditions.map(
                        (c, i) => ({
                          class: c,
                          confidence:
                            (selectedAnalysis.confidenceScores[i] || 50) / 100,
                        }),
                      ),
                    })}`,
                  )
                }
              >
                <Ionicons name="eye" size={18} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>View Routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDelete]}
                onPress={() => handleDeleteAnalysis(selectedAnalysis.id || "")}
              >
                <Ionicons name="trash" size={18} color="#FF6B6B" />
                <Text style={[styles.actionButtonText, { color: "#FF6B6B" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </MotionView>
        </ScrollView>
      ) : (
        // List View
        <>
          <MotionView style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analysis History</Text>
            <TouchableOpacity onPress={loadHistory}>
              <Ionicons name="refresh" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </MotionView>

          {/* Stats */}
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
                <Text style={styles.statLabel}>Avg Score</Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color: getSeverityColor(stats.averageHealthScore),
                    },
                  ]}
                >
                  {stats.averageHealthScore}
                </Text>
              </View>
            </MotionView>
          )}

          {/* Analyses List */}
          <FlatList
            data={analyses}
            renderItem={({ item }) => <AnalysisCard analysis={item} />}
            keyExtractor={(item) => item.id || ""}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>No analysis history yet</Text>
                <Text style={styles.emptySubtext}>
                  Start by capturing a photo to analyze your skin
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardConditions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  conditionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
  },
  conditionBadge: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  conditionBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  moreBadge: {
    backgroundColor: COLORS.textSecondary + "20",
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  moreBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.m,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.s,
    textAlign: "center",
    maxWidth: 250,
  },
  detailContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  detailSection: {
    marginBottom: SPACING.xl,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scoreLargeContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  scoreLargeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreLargeText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  conditionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conditionItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.m,
    marginTop: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "20",
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  actionButtonDelete: {
    backgroundColor: "#FF6B6B20",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
