// app/dashboard/consultation.tsx
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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { MotionView } from "../../components/MotionView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import {
    createConsultationRequest,
    getUserConsultations,
    type ConsultationRequest,
} from "../../services/consultationService";

export default function ConsultationScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [conditions, setConditions] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  const severityOptions = ["low", "medium", "high"];
  const conditionOptions = [
    "Acne",
    "Wrinkles",
    "Dark Spots",
    "Sensitivity",
    "Oiliness",
    "Dryness",
    "Redness",
    "Pores",
    "Blackheads",
    "Other",
  ];

  // Load consultations
  useFocusEffect(
    useCallback(() => {
      if (mode === "list") {
        loadConsultations();
      }
    }, [mode]),
  );

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await getUserConsultations();
      setConsultations(data);
    } catch (error) {
      console.error("Error loading consultations:", error);
      Alert.alert("Error", "Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    if (conditions.includes(condition)) {
      setConditions(conditions.filter((c) => c !== condition));
    } else {
      setConditions([...conditions, condition]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        "Validation Error",
        "Please fill in the title and description",
      );
      return;
    }

    if (conditions.length === 0) {
      Alert.alert("Validation Error", "Please select at least one condition");
      return;
    }

    setFormLoading(true);
    try {
      const consultationId = await createConsultationRequest({
        title,
        description,
        detectedConditions: conditions,
        severity,
      });

      Alert.alert("Success", "Your consultation request has been submitted!", [
        {
          text: "View Request",
          onPress: () => {
            setMode("list");
            loadConsultations();
          },
        },
      ]);

      // Reset form
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
        return COLORS.textSecondary;
      default:
        return COLORS.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time";
      case "in-progress":
        return "sync";
      case "resolved":
        return "checkmark-circle";
      case "closed":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const ConsultationCard = ({
    consultation,
  }: {
    consultation: ConsultationRequest;
  }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderLeftColor: getStatusColor(consultation.status),
        },
      ]}
      onPress={() => {
        // Could navigate to detail view
      }}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{consultation.title}</Text>
          <Text style={styles.cardDate}>
            {new Date(consultation.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(consultation.status) + "20" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(consultation.status) as any}
            size={16}
            color={getStatusColor(consultation.status)}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: getStatusColor(consultation.status),
              },
            ]}
          >
            {consultation.status.charAt(0).toUpperCase() +
              consultation.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {consultation.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.conditionsList}>
          {consultation.detectedConditions.slice(0, 2).map((cond, i) => (
            <View key={i} style={styles.conditionTag}>
              <Text style={styles.conditionTagText}>{cond}</Text>
            </View>
          ))}
          {consultation.detectedConditions.length > 2 && (
            <View style={styles.conditionTag}>
              <Text style={styles.conditionTagText}>
                +{consultation.detectedConditions.length - 2}
              </Text>
            </View>
          )}
        </View>

        {consultation.isUrgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}
      </View>

      {consultation.response && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Expert Response:</Text>
          <Text style={styles.responseText} numberOfLines={3}>
            {consultation.response}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (mode === "list") {
    return (
      <View style={styles.container}>
        <MotionView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expert Consultations</Text>
          <TouchableOpacity onPress={() => setMode("create")}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </MotionView>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={consultations}
            renderItem={({ item }) => <ConsultationCard consultation={item} />}
            keyExtractor={(item) => item.id || ""}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="mail" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No consultations yet</Text>
                <Text style={styles.emptySubtext}>
                  Request expert help with your skin concerns
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setMode("create")}
                >
                  <Text style={styles.createButtonText}>
                    Request Consultation
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // Create mode
  return (
    <ScrollView style={styles.container}>
      <MotionView style={styles.header}>
        <TouchableOpacity onPress={() => setMode("list")}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Consultation</Text>
        <View style={{ width: 24 }} />
      </MotionView>

      <MotionView delay={50} style={styles.formContent}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your concern"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
            editable={!formLoading}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Please describe your skin issue in detail..."
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            editable={!formLoading}
            textAlignVertical="top"
          />
        </View>

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.label}>Affected Conditions *</Text>
          <View style={styles.conditionsGrid}>
            {conditionOptions.map((condition) => (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.conditionCheckbox,
                  conditions.includes(condition) &&
                    styles.conditionCheckboxActive,
                ]}
                onPress={() => toggleCondition(condition)}
                disabled={formLoading}
              >
                <Ionicons
                  name={
                    conditions.includes(condition)
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={18}
                  color={
                    conditions.includes(condition)
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.conditionLabel,
                    conditions.includes(condition) &&
                      styles.conditionLabelActive,
                  ]}
                >
                  {condition}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.label}>Severity Level *</Text>
          <View style={styles.severityContainer}>
            {severityOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.severityButton,
                  severity === option && styles.severityButtonActive,
                ]}
                onPress={() => setSeverity(option as any)}
                disabled={formLoading}
              >
                <Text
                  style={[
                    styles.severityText,
                    severity === option && styles.severityTextActive,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            Our dermatology experts will review your case and provide
            personalized recommendations within 24 hours.
          </Text>
        </View>
      </MotionView>

      <MotionView delay={100} style={styles.footer}>
        <PrimaryButton
          title={formLoading ? "Submitting..." : "Submit Consultation"}
          onPress={handleSubmit}
          disabled={formLoading}
        />
        <TouchableOpacity
          onPress={() => setMode("list")}
          disabled={formLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </MotionView>
    </ScrollView>
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
  },
  header: {
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
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.m,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.m,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.m,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conditionsList: {
    flexDirection: "row",
    gap: SPACING.s,
    flex: 1,
  },
  conditionTag: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  conditionTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.m,
  },
  urgentText: {
    fontSize: 11,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  responseBox: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  responseText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
  },
  createButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.m,
  },
  createButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  formContent: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textarea: {
    minHeight: 120,
    paddingTop: SPACING.m,
  },
  conditionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.m,
  },
  conditionCheckbox: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.surface,
  },
  conditionCheckboxActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  conditionLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  conditionLabelActive: {
    color: COLORS.primary,
  },
  severityContainer: {
    flexDirection: "row",
    gap: SPACING.m,
  },
  severityButton: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  severityButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  severityText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  severityTextActive: {
    color: "#FFF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "10",
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.m,
    marginTop: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
    gap: SPACING.m,
  },
  cancelText: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
  },
});
