import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { calculateHealthScore, getRecommendation, normalizeDetectedCondition } from "../../services/diseaseRoutineService";
import { detectSkinDisease, type RoboflowResponse } from "../../services/roboflowService";

type AnalysisSummary = {
  detectedConditions: string[];
  confidenceScores: number[];
  healthScore: number;
  recommendations: ReturnType<typeof getRecommendation>[];
};

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photoData = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    setPhoto(photoData?.uri || null);
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setPhoto(result.assets[0]?.uri || null);
    } catch (error: any) {
      Alert.alert("Upload Failed", `Could not open your photo library: ${error?.message || "Unknown error"}`);
    }
  };

  const buildAnalysisSummary = (roboflowData: RoboflowResponse): AnalysisSummary => {
    const validPredictions = (roboflowData.predictions || []).filter(
      (prediction) => prediction.class && prediction.confidence !== undefined && prediction.confidence !== null,
    );
    const detectedConditions = validPredictions.map((prediction) => normalizeDetectedCondition(prediction.class));
    const confidenceScores = validPredictions.map((prediction) => Math.round((prediction.confidence || 0) * 100));
    return {
      detectedConditions,
      confidenceScores,
      healthScore: calculateHealthScore(detectedConditions, confidenceScores),
      recommendations: detectedConditions.map((condition) => getRecommendation(condition)),
    };
  };

  const openResults = async (imageUri: string, roboflowData: RoboflowResponse) => {
    try {
      await AsyncStorage.setItem("lastAnalysis", JSON.stringify({ imageUri, predictions: roboflowData }));
    } catch {}
    router.push({
      pathname: "/camera/results",
      params: { imageUri, predictions: JSON.stringify(roboflowData) },
    });
  };

  const analyze = async () => {
    if (!photo) {
      Alert.alert("No Photo", "Please capture or upload a photo before analyzing.");
      return;
    }

    setLoading(true);
    try {
      const roboflowData = await detectSkinDisease(photo);
      const { detectedConditions, confidenceScores } = buildAnalysisSummary(roboflowData);
      const details = detectedConditions.length
        ? detectedConditions.map((condition, index) => `- ${condition} (${confidenceScores[index]}% confidence)`).join("\n")
        : "No skin conditions detected. Keep up your skincare routine!";
      const summary = detectedConditions.length ? `Detected ${detectedConditions.length} Conditions:\n\n${details}` : `Your skin looks healthy!\n\n${details}`;

      setLoading(false);
      if (Platform.OS === "web") {
        const view = window.confirm(`${summary}\n\nClick OK to view routine, Cancel to choose another photo.`);
        if (view) await openResults(photo, roboflowData);
        else setPhoto(null);
        return;
      }

      Alert.alert("Analysis Complete", summary, [
        { text: "View Routine", onPress: () => void openResults(photo, roboflowData) },
        { text: "Choose Another", style: "cancel", onPress: () => setPhoto(null) },
      ]);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("We Could Not Read This Scan", "The photo was not analyzed confidently. You can try another scan, or send this case to an expert for personal help.", [
        {
          text: "Contact Expert",
          onPress: () =>
            router.push({
              pathname: "/dashboard/consultation",
              params: {
                mode: "create",
                title: "Skin scan could not be analyzed",
                description: `The AI skin scan could not confidently analyze this photo.\n\nAnalysis issue: ${error?.message || "Unknown analysis error"}\nPhoto available: ${photo ? "Yes" : "No"}`,
                severity: "medium",
                conditions: JSON.stringify(["Other"]),
                source: "analysis-failed",
              },
            }),
        },
        { text: "Try Again", style: "cancel" },
      ]);
    }
  };

  if (photo) {
    return (
      <View style={styles.cameraShell}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={() => setPhoto(null)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickPhoto} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={analyze} style={styles.primaryBtn} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? "Analyzing..." : "Analyze Photo"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="images-outline" size={48} color={colors.primary} style={styles.permissionIcon} />
        <Text style={styles.text}>
          Camera access is optional. Enable it to capture a photo, or upload one from your gallery and analyze it with the Roboflow skin model.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickPhoto}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
          <Text style={styles.uploadBtnText}>Upload a Photo Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraShell}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={pickPhoto} style={styles.headerAction}>
              <Ionicons name="images-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.guideContainer}>
            <View style={styles.faceGuide} />
            <Text style={styles.guideText}>Align your face within the frame</Text>
            <TouchableOpacity style={styles.galleryChip} onPress={pickPhoto}>
              <Ionicons name="cloud-upload-outline" size={16} color="#FFF" />
              <Text style={styles.galleryChipText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    cameraShell: { flex: 1, backgroundColor: "#000" },
    permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.l, backgroundColor: colors.background },
    permissionIcon: { marginBottom: SPACING.m },
    text: { textAlign: "center", marginBottom: SPACING.l, fontSize: 16, lineHeight: 24, color: colors.text },
    btn: { backgroundColor: colors.primary, paddingHorizontal: SPACING.l, paddingVertical: 15, borderRadius: RADIUS.m },
    btnText: { color: "#FFF", fontWeight: "bold" },
    uploadBtn: { flexDirection: "row", alignItems: "center", marginTop: SPACING.m, backgroundColor: colors.card, paddingHorizontal: SPACING.l, paddingVertical: 14, borderRadius: RADIUS.m, borderWidth: 1, borderColor: colors.border },
    uploadBtnText: { marginLeft: SPACING.s, color: colors.text, fontWeight: "600" },
    camera: { flex: 1 },
    preview: { flex: 1, resizeMode: "cover" },
    previewHeader: { position: "absolute", top: SPACING.xl, right: SPACING.l },
    overlay: { flex: 1, justifyContent: "space-between", padding: SPACING.l, backgroundColor: "rgba(0,0,0,0.3)" },
    header: { marginTop: SPACING.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerAction: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
    guideContainer: { alignItems: "center" },
    faceGuide: { width: 250, height: 320, borderRadius: 150, borderWidth: 2, borderColor: "#FFF", borderStyle: "dashed", backgroundColor: "transparent" },
    guideText: { color: "#FFF", marginTop: SPACING.m, fontSize: 16, fontWeight: "500" },
    galleryChip: { flexDirection: "row", alignItems: "center", marginTop: SPACING.m, paddingHorizontal: SPACING.m, paddingVertical: 10, borderRadius: RADIUS.round, backgroundColor: "rgba(0,0,0,0.35)" },
    galleryChipText: { marginLeft: SPACING.s, color: "#FFF", fontWeight: "600" },
    footer: { alignItems: "center", marginBottom: SPACING.xl },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center" },
    captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFF" },
    controlRow: { position: "absolute", left: 20, right: 20, bottom: 40, flexDirection: "row", alignItems: "center" },
    primaryBtn: { flex: 1.35, backgroundColor: colors.primary, marginLeft: 10, padding: 15, borderRadius: RADIUS.round, alignItems: "center" },
    primaryBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    secondaryBtn: { flex: 1, backgroundColor: colors.card, marginRight: 10, padding: 15, borderRadius: RADIUS.round, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    secondaryBtnText: { color: colors.text, fontWeight: "bold", fontSize: 16 },
  });
