import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { createConsultationRequest, getConsultationDetails, getUserConsultations, type ConsultationRequest } from "../../services/consultationService";
import { getDermatologists, getUserProfileSafe, type UserProfile } from "../../services/firebaseUserService";

export default function ConsultationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [conditions, setConditions] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [experts, setExperts] = useState<UserProfile[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [selectedExpertId, setSelectedExpertId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const severityOptions = ["low", "medium", "high"];
  const conditionOptions = ["Acne", "Wrinkles", "Dark Spots", "Sensitivity", "Oiliness", "Dryness", "Redness", "Pores", "Blackheads", "Other"];

  useEffect(() => {
    if (params.mode === "create") setMode("create");
    if (typeof params.title === "string" && params.title.trim()) setTitle(params.title);
    if (typeof params.description === "string" && params.description.trim()) setDescription(params.description);
    if (params.severity === "low" || params.severity === "medium" || params.severity === "high") setSeverity(params.severity);
    if (typeof params.conditions === "string" && params.conditions.trim()) {
      try {
        const parsed = JSON.parse(params.conditions) as string[];
        if (Array.isArray(parsed)) setConditions(parsed);
      } catch {}
    }
  }, [params.conditions, params.description, params.mode, params.severity, params.title]);

  useEffect(() => {
    const consultationId =
      typeof params.consultationId === "string" ? params.consultationId : "";

    if (!consultationId) {
      return;
    }

    const loadConsultation = async () => {
      try {
        const consultation = await getConsultationDetails(consultationId);
        if (consultation) {
          setSelectedConsultation(consultation);
        }
      } catch (error) {
        console.error("[Consultation] Failed to load consultation detail:", error);
      }
    };

    void loadConsultation();
  }, [params.consultationId]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const loadExperts = async () => {
      try {
        setLoadingExperts(true);
        const dermatologistList = await getDermatologists();
        setExperts(dermatologistList);

        if (!selectedExpertId && dermatologistList.length > 0) {
          setSelectedExpertId(dermatologistList[0].uid);
        }
      } catch (error) {
        console.error("[Consultation] Failed to load experts:", error);
      } finally {
        setLoadingExperts(false);
      }
    };

    void loadExperts();
  }, [mode, selectedExpertId]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const profile = await getUserProfileSafe();
          if (profile.role === "dermatologist") {
            router.replace("/expert-dashboard");
            return;
          }

          if (mode !== "list") {
            return;
          }

          setLoading(true);
          const items = await getUserConsultations();
          setConsultations(items);

          const consultationId =
            typeof params.consultationId === "string" ? params.consultationId : "";
          if (consultationId) {
            const matched = items.find((item) => item.id === consultationId);
            if (matched) {
              setSelectedConsultation(matched);
            }
          }
        } catch {
          Alert.alert("Error", "Failed to load consultations");
        } finally {
          setLoading(false);
        }
      };
      void load();
    }, [mode, params.consultationId, router]),
  );

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Validation Error", "Please fill in the title and description");
      return;
    }
    if (!conditions.length) {
      Alert.alert("Validation Error", "Please select at least one condition");
      return;
    }
    const selectedExpert = experts.find((expert) => expert.uid === selectedExpertId);
    if (!selectedExpert) {
      Alert.alert("Validation Error", "Please select a dermatologist.");
      return;
    }
    setFormLoading(true);
    try {
      await createConsultationRequest({
        title,
        description,
        detectedConditions: conditions,
        severity,
        dermatologistId: selectedExpert.uid,
        dermatologistName:
          selectedExpert.fullName || selectedExpert.name || "Dermatologist",
        dermatologistQualifications: selectedExpert.qualifications || "",
      });
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setConditions([]);
      setSelectedExpertId(selectedExpert.uid);
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit request");
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "in-progress":
        return "#2196F3";
      case "resolved":
        return "#51CF66";
      case "closed":
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  if (mode === "list" && selectedConsultation) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.detailContent}>
        <MotionView style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedConsultation(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultation History</Text>
          <View style={{ width: 24 }} />
        </MotionView>

        <View style={styles.detailCard}>
          <View style={styles.detailTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>{selectedConsultation.title}</Text>
              <Text style={styles.detailDate}>
                Submitted {new Date(selectedConsultation.createdAt).toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    getStatusColor(selectedConsultation.status) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(selectedConsultation.status) },
                ]}
              >
                {selectedConsultation.status.charAt(0).toUpperCase() +
                  selectedConsultation.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailMetaRow}>
            <Text style={styles.detailMetaChip}>
              Severity: {selectedConsultation.severity}
            </Text>
            {selectedConsultation.isUrgent ? (
              <Text style={styles.urgentChip}>Urgent</Text>
            ) : null}
          </View>

          <Text style={styles.detailSectionTitle}>Selected Expert</Text>
          <Text style={styles.detailSectionText}>
            {selectedConsultation.dermatologistName}
            {selectedConsultation.dermatologistQualifications
              ? ` - ${selectedConsultation.dermatologistQualifications}`
              : ""}
          </Text>

          <Text style={styles.detailSectionTitle}>Your Description</Text>
          <Text style={styles.detailSectionText}>
            {selectedConsultation.description}
          </Text>

          <Text style={styles.detailSectionTitle}>Conditions</Text>
          <View style={styles.conditionsList}>
            {selectedConsultation.detectedConditions.map((cond, i) => (
              <View key={i} style={styles.conditionTag}>
                <Text style={styles.conditionTagText}>{cond}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.detailSectionTitle}>Expert Reply</Text>
          {selectedConsultation.response ? (
            <View style={styles.responseDetailBox}>
              <Text style={styles.responseText}>{selectedConsultation.response}</Text>
              <Text style={styles.responseMeta}>
                {selectedConsultation.respondedBy || "Dermatologist"}
                {selectedConsultation.responderQualifications
                  ? ` • ${selectedConsultation.responderQualifications}`
                  : ""}
              </Text>
              {selectedConsultation.respondedAt ? (
                <Text style={styles.responseMeta}>
                  Replied {new Date(selectedConsultation.respondedAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.pendingReplyBox}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.pendingReplyText}>
                Your consultation is waiting for a dermatologist reply.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  if (mode === "list") {
    return (
      <View style={styles.container}>
        <MotionView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expert Consultations</Text>
          <TouchableOpacity onPress={() => setMode("create")}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </MotionView>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={consultations}
            keyExtractor={(item) => item.id || ""}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: getStatusColor(item.status) }]}
                onPress={() => setSelectedConsultation(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.cardMetaText}>
                      Expert: {item.dermatologistName}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.conditionsList}>
                  {item.detectedConditions.slice(0, 3).map((cond, i) => (
                    <View key={i} style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>{cond}</Text>
                    </View>
                  ))}
                </View>
                {item.response && (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>Expert Response:</Text>
                    <Text style={styles.responseText} numberOfLines={3}>{item.response}</Text>
                  </View>
                )}
                <Text style={styles.viewMoreText}>Tap to view full history</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="mail" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No consultations yet</Text>
                <Text style={styles.emptySubtext}>Request expert help with your skin concerns</Text>
                <TouchableOpacity style={styles.createButton} onPress={() => setMode("create")}>
                  <Text style={styles.createButtonText}>Request Consultation</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <MotionView style={styles.header}>
          <TouchableOpacity onPress={() => setMode("list")}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Consultation</Text>
          <View style={{ width: 24 }} />
        </MotionView>
        <MotionView delay={50} style={styles.formContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Choose Dermatologist *</Text>
            {loadingExperts ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.inlineLoaderText}>Loading registered experts...</Text>
              </View>
            ) : experts.length === 0 ? (
              <View style={styles.expertEmptyState}>
                <Text style={styles.expertEmptyTitle}>No dermatologists available</Text>
                <Text style={styles.expertEmptyText}>
                  Please register a dermatologist account first.
                </Text>
              </View>
            ) : (
              <View style={styles.expertList}>
                {experts.map((expert) => {
                  const isSelected = selectedExpertId === expert.uid;
                  const displayName =
                    expert.fullName || expert.name || "Dermatologist";

                  return (
                    <TouchableOpacity
                      key={expert.uid}
                      style={[
                        styles.expertCard,
                        isSelected && styles.expertCardSelected,
                      ]}
                      onPress={() => setSelectedExpertId(expert.uid)}
                      disabled={formLoading}
                    >
                      <View style={styles.expertCardHeader}>
                        <View style={styles.expertAvatar}>
                          <Ionicons
                            name="medkit-outline"
                            size={18}
                            color={isSelected ? "#FFF" : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.expertName,
                              isSelected && styles.expertNameSelected,
                            ]}
                          >
                            {displayName}
                          </Text>
                          <Text
                            style={[
                              styles.expertQualifications,
                              isSelected && styles.expertQualificationsSelected,
                            ]}
                          >
                            {expert.qualifications || "Dermatologist"}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={isSelected ? "#FFF" : colors.textSecondary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="Brief description of your concern" placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle} editable={!formLoading} />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Detailed Description *</Text>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Please describe your skin issue in detail..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={5} editable={!formLoading} textAlignVertical="top" />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Affected Conditions *</Text>
            <View style={styles.conditionsGrid}>
              {conditionOptions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[styles.conditionCheckbox, conditions.includes(condition) && styles.conditionCheckboxActive]}
                  onPress={() => setConditions((prev) => prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition])}
                  disabled={formLoading}
                >
                  <Text style={[styles.conditionLabel, conditions.includes(condition) && styles.conditionLabelActive]}>{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Severity Level *</Text>
            <View style={styles.severityContainer}>
              {severityOptions.map((option) => (
                <TouchableOpacity key={option} style={[styles.severityButton, severity === option && styles.severityButtonActive]} onPress={() => setSeverity(option as any)} disabled={formLoading}>
                  <Text style={[styles.severityText, severity === option && styles.severityTextActive]}>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Expert Review Assist</Text>
              <Text style={styles.infoText}>Our dermatology experts will review your case and provide personalized recommendations within 24 hours.</Text>
            </View>
          </View>
        </MotionView>
        <MotionView delay={100} style={styles.footer}>
          <PrimaryButton title={formLoading ? "Submitting..." : "Submit Consultation"} onPress={handleSubmit} disabled={formLoading} />
          <TouchableOpacity onPress={() => setMode("list")} disabled={formLoading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </MotionView>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <MotionView style={styles.successModal}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={34} color="#FFF" />
            </View>
            <Text style={styles.successTitle}>Consultation Submitted</Text>
            <Text style={styles.successText}>
              Your consultation was submitted successfully. Your selected dermatologist will review it soon.
            </Text>
            <PrimaryButton
              title="View Request"
              onPress={() => {
                setShowSuccessModal(false);
                setMode("list");
              }}
            />
            <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.successSecondary}>Stay Here</Text>
            </TouchableOpacity>
          </MotionView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.l, paddingTop: SPACING.l, paddingBottom: SPACING.m },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    listContent: { paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, paddingBottom: SPACING.xl },
    detailContent: { paddingBottom: SPACING.xl },
    card: { backgroundColor: colors.surface, borderRadius: RADIUS.m, padding: SPACING.m, marginBottom: SPACING.m, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.m },
    cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    cardDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    cardMetaText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderRadius: RADIUS.m },
    statusText: { fontSize: 11, fontWeight: "600" },
    cardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: SPACING.m },
    conditionsList: { flexDirection: "row", gap: SPACING.s, flex: 1, flexWrap: "wrap" },
    conditionTag: { backgroundColor: colors.primary + "20", borderRadius: RADIUS.m, paddingHorizontal: SPACING.s, paddingVertical: 2 },
    conditionTagText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
    responseBox: { marginTop: SPACING.m, paddingTop: SPACING.m, borderTopWidth: 1, borderTopColor: colors.border },
    responseLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: SPACING.s },
    responseText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    responseMeta: { fontSize: 12, color: colors.textSecondary, marginTop: SPACING.s, lineHeight: 18 },
    viewMoreText: { marginTop: SPACING.m, color: colors.primary, fontWeight: "600", fontSize: 12 },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
    emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: SPACING.m },
    emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: SPACING.s, textAlign: "center" },
    createButton: { marginTop: SPACING.xl, backgroundColor: colors.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.m, borderRadius: RADIUS.m },
    createButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
    formContent: { paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
    section: { marginBottom: SPACING.xl },
    inlineLoader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.s,
      paddingVertical: SPACING.s,
    },
    inlineLoaderText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    expertEmptyState: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expertEmptyTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 14,
    },
    expertEmptyText: {
      color: colors.textSecondary,
      marginTop: SPACING.s,
      lineHeight: 18,
    },
    expertList: {
      gap: SPACING.m,
    },
    expertCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expertCardSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    expertCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.m,
    },
    expertAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary + "14",
      justifyContent: "center",
      alignItems: "center",
    },
    expertName: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 15,
    },
    expertNameSelected: {
      color: "#FFF",
    },
    expertQualifications: {
      color: colors.textSecondary,
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
    },
    expertQualificationsSelected: {
      color: "rgba(255,255,255,0.85)",
    },
    label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: SPACING.m },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, fontSize: 14, color: colors.text, backgroundColor: colors.surface },
    textarea: { minHeight: 120, paddingTop: SPACING.m },
    conditionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.m },
    conditionCheckbox: { minWidth: "45%", paddingVertical: SPACING.m, paddingHorizontal: SPACING.m, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, backgroundColor: colors.surface },
    conditionCheckboxActive: { backgroundColor: colors.primary + "20", borderColor: colors.primary },
    conditionLabel: { fontSize: 13, color: colors.text, fontWeight: "500" },
    conditionLabelActive: { color: colors.primary },
    severityContainer: { flexDirection: "row", gap: SPACING.m },
    severityButton: { flex: 1, paddingVertical: SPACING.m, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.m, alignItems: "center", backgroundColor: colors.surface },
    severityButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    severityText: { fontSize: 13, fontWeight: "600", color: colors.text },
    severityTextActive: { color: "#FFF" },
    infoBox: { flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.primary + "10", borderRadius: RADIUS.m, padding: SPACING.m, gap: SPACING.m, marginTop: SPACING.xl },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
    infoText: { fontSize: 13, color: colors.text, lineHeight: 18 },
    footer: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl, gap: SPACING.m },
    cancelText: { textAlign: "center", fontSize: 14, color: colors.textSecondary, marginTop: SPACING.m },
    detailCard: {
      marginHorizontal: SPACING.l,
      backgroundColor: colors.card,
      borderRadius: RADIUS.l,
      padding: SPACING.l,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: SPACING.m,
    },
    detailTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    detailDate: {
      marginTop: SPACING.s,
      color: colors.textSecondary,
      fontSize: 12,
    },
    detailMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.s,
      marginTop: SPACING.m,
    },
    detailMetaChip: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,
      borderRadius: 999,
      overflow: "hidden",
      paddingHorizontal: SPACING.m,
      paddingVertical: SPACING.s,
      fontSize: 12,
    },
    detailSectionTitle: {
      marginTop: SPACING.l,
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    detailSectionText: {
      marginTop: SPACING.s,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    responseDetailBox: {
      marginTop: SPACING.s,
      backgroundColor: colors.primary + "10",
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    pendingReplyBox: {
      marginTop: SPACING.s,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      gap: SPACING.s,
      alignItems: "center",
    },
    pendingReplyText: {
      flex: 1,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(9, 16, 24, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.l,
    },
    successModal: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: RADIUS.l,
      padding: SPACING.xl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    successIconWrap: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.l,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 18,
      elevation: 8,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    successText: {
      marginTop: SPACING.m,
      marginBottom: SPACING.l,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: "center",
    },
    successSecondary: {
      marginTop: SPACING.s,
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
  });
