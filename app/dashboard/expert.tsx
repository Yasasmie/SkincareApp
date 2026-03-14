import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { auth } from "../../firebaseConfig";
import {
  getAssignedConsultations,
  respondToConsultation,
  type ConsultationRequest,
} from "../../services/consultationService";
import { getUserProfileSafe } from "../../services/firebaseUserService";

export default function ExpertDashboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expertName, setExpertName] = useState("Dermatologist");

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const profile = await getUserProfileSafe();
      if (profile.role !== "dermatologist") {
        Alert.alert(
          "Access Denied",
          "Only dermatologist accounts can view this dashboard.",
        );
        router.replace("/dashboard/home");
        return;
      }

      setExpertName(profile.fullName || profile.name || "Dermatologist");
      setConsultations(await getAssignedConsultations());
    } catch (error) {
      console.error("[ExpertDashboard] Failed to load:", error);
      Alert.alert("Error", "Failed to load consultation requests.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  const handleReply = async (consultationId: string) => {
    if (!replyText.trim()) {
      Alert.alert("Reply Required", "Please enter your response.");
      return;
    }

    try {
      setSubmittingId(consultationId);
      await respondToConsultation(consultationId, replyText.trim(), "resolved");
      setReplyText("");
      setActiveReplyId(null);
      await loadDashboard();
    } catch (error: any) {
      Alert.alert("Reply Failed", error?.message || "Unable to send reply.");
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusColor = (status: ConsultationRequest["status"]) => {
    switch (status) {
      case "pending":
        return "#D9822B";
      case "in-progress":
        return "#2D72D2";
      case "resolved":
        return "#2F9E44";
      case "closed":
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MotionView style={styles.hero}>
        <View>
          <Text style={styles.heroEyebrow}>Expert Dashboard</Text>
          <Text style={styles.heroTitle}>{expertName}</Text>
          <Text style={styles.heroSubtitle}>
            Review the consultation requests assigned to you and reply directly
            from here.
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </MotionView>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{consultations.length}</Text>
          <Text style={styles.summaryLabel}>Assigned Requests</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {consultations.filter((item) => item.status === "pending").length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {consultations.filter((item) => item.isUrgent).length}
          </Text>
          <Text style={styles.summaryLabel}>Urgent</Text>
        </View>
      </View>

      <FlatList
        data={consultations}
        keyExtractor={(item) => item.id || item.createdAt.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="medkit-outline"
              size={42}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No assigned consultations yet</Text>
            <Text style={styles.emptyText}>
              Patient requests sent to you will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isReplyOpen = activeReplyId === item.id;
          const statusColor = getStatusColor(item.status);

          return (
            <MotionView style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                  <Text style={styles.requestMeta}>
                    {item.userName || "User"} | {item.email}
                  </Text>
                  <Text style={styles.requestMeta}>
                    Assigned expert: {item.dermatologistName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + "20" },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>Severity: {item.severity}</Text>
                {item.isUrgent ? (
                  <Text style={styles.urgentChip}>Urgent</Text>
                ) : null}
                <Text style={styles.metaChip}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>

              <Text style={styles.sectionLabel}>Detected Conditions</Text>
              <View style={styles.conditionRow}>
                {item.detectedConditions.map((condition) => (
                  <View
                    key={`${item.id}-${condition}`}
                    style={styles.conditionChip}
                  >
                    <Text style={styles.conditionChipText}>{condition}</Text>
                  </View>
                ))}
              </View>

              {item.response ? (
                <View style={styles.responseCard}>
                  <Text style={styles.responseHeading}>Previous Reply</Text>
                  <Text style={styles.responseText}>{item.response}</Text>
                  <Text style={styles.responseMeta}>
                    {item.respondedBy || "Dermatologist"}
                  </Text>
                </View>
              ) : null}

              {isReplyOpen ? (
                <ScrollView nestedScrollEnabled>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write your dermatologist response here..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={5}
                    value={replyText}
                    onChangeText={setReplyText}
                    textAlignVertical="top"
                  />
                  <PrimaryButton
                    title={submittingId === item.id ? "Sending..." : "Send Reply"}
                    onPress={() => void handleReply(item.id || "")}
                    disabled={submittingId === item.id}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setActiveReplyId(null);
                      setReplyText("");
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => {
                    setActiveReplyId(item.id || null);
                    setReplyText(item.response || "");
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.replyButtonText}>
                    {item.response ? "Update Reply" : "Reply to Request"}
                  </Text>
                </TouchableOpacity>
              )}
            </MotionView>
          );
        }}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
    },
    hero: {
      backgroundColor: colors.header,
      paddingTop: 56,
      paddingHorizontal: SPACING.l,
      paddingBottom: SPACING.l,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    heroEyebrow: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    heroTitle: {
      color: "#FFF",
      fontSize: 28,
      fontWeight: "700",
      marginTop: 6,
    },
    heroSubtitle: {
      color: "rgba(255,255,255,0.85)",
      marginTop: SPACING.s,
      maxWidth: 280,
      lineHeight: 20,
    },
    logoutButton: {
      backgroundColor: "rgba(255,255,255,0.18)",
      padding: SPACING.m,
      borderRadius: 999,
    },
    summaryRow: {
      flexDirection: "row",
      paddingHorizontal: SPACING.l,
      marginTop: -20,
      gap: SPACING.s,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryNumber: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    summaryLabel: {
      marginTop: 4,
      color: colors.textSecondary,
      fontSize: 12,
    },
    listContent: {
      padding: SPACING.l,
      paddingBottom: SPACING.xl,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 72,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginTop: SPACING.m,
    },
    emptyText: {
      color: colors.textSecondary,
      marginTop: SPACING.s,
      textAlign: "center",
      lineHeight: 20,
    },
    requestCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.l,
      padding: SPACING.l,
      marginBottom: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestHeader: {
      flexDirection: "row",
      gap: SPACING.s,
      alignItems: "flex-start",
    },
    requestTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 17,
    },
    requestMeta: {
      color: colors.textSecondary,
      marginTop: 4,
      fontSize: 12,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.s,
      marginTop: SPACING.m,
    },
    metaChip: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      fontSize: 12,
      overflow: "hidden",
    },
    urgentChip: {
      backgroundColor: "#FFE3E3",
      color: "#C92A2A",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      fontSize: 12,
      fontWeight: "700",
      overflow: "hidden",
    },
    sectionLabel: {
      marginTop: SPACING.m,
      color: colors.text,
      fontWeight: "700",
      fontSize: 13,
    },
    description: {
      color: colors.textSecondary,
      marginTop: SPACING.s,
      lineHeight: 20,
    },
    conditionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.s,
      marginTop: SPACING.s,
    },
    conditionChip: {
      backgroundColor: colors.primary + "16",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    conditionChipText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    responseCard: {
      marginTop: SPACING.m,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: SPACING.m,
    },
    responseHeading: {
      color: colors.text,
      fontWeight: "700",
      marginBottom: SPACING.s,
    },
    responseText: {
      color: colors.textSecondary,
      lineHeight: 20,
    },
    responseMeta: {
      color: colors.textSecondary,
      marginTop: SPACING.s,
      fontSize: 12,
    },
    replyInput: {
      minHeight: 120,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.m,
      color: colors.text,
      marginTop: SPACING.m,
      marginBottom: SPACING.m,
    },
    replyButton: {
      marginTop: SPACING.m,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.m,
      paddingVertical: SPACING.m,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.s,
    },
    replyButtonText: {
      color: "#FFF",
      fontWeight: "700",
    },
    cancelText: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: SPACING.m,
    },
  });
