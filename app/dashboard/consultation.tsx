import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { createConsultationRequest, getUserConsultations, type ConsultationRequest } from "../../services/consultationService";

export default function ConsultationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [conditions, setConditions] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      if (mode !== "list") return;
      const load = async () => {
        try {
          setLoading(true);
          setConsultations(await getUserConsultations());
        } catch {
          Alert.alert("Error", "Failed to load consultations");
        } finally {
          setLoading(false);
        }
      };
      void load();
    }, [mode]),
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
    setFormLoading(true);
    try {
      await createConsultationRequest({ title, description, detectedConditions: conditions, severity });
      Alert.alert("Success", "Your consultation request has been submitted!", [{ text: "View Request", onPress: () => setMode("list") }]);
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setConditions([]);
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
              <TouchableOpacity style={[styles.card, { borderLeftColor: getStatusColor(item.status) }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.l, paddingTop: SPACING.l, paddingBottom: SPACING.m },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    listContent: { paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, paddingBottom: SPACING.xl },
    card: { backgroundColor: colors.surface, borderRadius: RADIUS.m, padding: SPACING.m, marginBottom: SPACING.m, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.m },
    cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    cardDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.m, paddingVertical: SPACING.s, borderRadius: RADIUS.m },
    statusText: { fontSize: 11, fontWeight: "600" },
    cardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: SPACING.m },
    conditionsList: { flexDirection: "row", gap: SPACING.s, flex: 1, flexWrap: "wrap" },
    conditionTag: { backgroundColor: colors.primary + "20", borderRadius: RADIUS.m, paddingHorizontal: SPACING.s, paddingVertical: 2 },
    conditionTagText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
    responseBox: { marginTop: SPACING.m, paddingTop: SPACING.m, borderTopWidth: 1, borderTopColor: colors.border },
    responseLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: SPACING.s },
    responseText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
    emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: SPACING.m },
    emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: SPACING.s, textAlign: "center" },
    createButton: { marginTop: SPACING.xl, backgroundColor: colors.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.m, borderRadius: RADIUS.m },
    createButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
    formContent: { paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
    section: { marginBottom: SPACING.xl },
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
  });
