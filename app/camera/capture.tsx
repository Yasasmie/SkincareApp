// app/camera/capture.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { saveAnalysis } from "../../services/analysisHistoryService";
import {
  calculateHealthScore,
  getRecommendation,
} from "../../services/diseaseRoutineService";
import { detectSkinDisease } from "../../services/roboflowService";

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>
          We need camera access to analyze your skin.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      setPhoto(photoData?.uri || null);
    }
  };

  const retake = () => setPhoto(null);

  const analyze = async () => {
    console.log("[Capture] Analyze button pressed");
    if (!photo) {
      console.log("[Capture] No photo available");
      Alert.alert("No Photo", "Please take a photo first before analyzing.");
      return;
    }

    setLoading(true);
    console.log("[Capture] Loading state set to true");
    console.log("[Capture] Photo URI:", photo);

    try {
      const roboflowData = await detectSkinDisease(photo);
      console.log("[Capture] Roboflow response received:", roboflowData);

      // Extract detected conditions
      const predictions = roboflowData.predictions || [];
      console.log("[Capture] Raw predictions:", JSON.stringify(predictions));

      // Filter predictions that have valid class names
      const validPredictions = predictions.filter(
        (p: any) => p.class && p.confidence !== undefined,
      );
      console.log(
        "[Capture] Valid predictions count:",
        validPredictions.length,
      );
      console.log(
        "[Capture] Valid predictions details:",
        JSON.stringify(validPredictions),
      );

      const detectedConditions = validPredictions.map((p: any) =>
        p.class.toLowerCase(),
      );
      const confidenceScores = validPredictions.map((p: any) =>
        Math.round((p.confidence || 0) * 100),
      );

      console.log("[Capture] Detected conditions:", detectedConditions);
      console.log("[Capture] Confidence scores:", confidenceScores);

      // Calculate health score and get recommendations
      const healthScore = calculateHealthScore(
        detectedConditions,
        confidenceScores,
      );
      const recommendations = detectedConditions.map((condition) =>
        getRecommendation(condition),
      );

      console.log("[Capture] Health score calculated:", healthScore);

      // Save analysis to history
      try {
        const analysisId = await saveAnalysis({
          detectedConditions,
          confidenceScores,
          healthScore,
          recommendations,
          saved: true,
        });
        console.log("[Capture] Analysis saved to history with ID:", analysisId);
      } catch (historyError) {
        console.warn("[Capture] Failed to save to history:", historyError);
        // Continue even if history save fails
      }

      // Create summary message with all conditions
      let summary = "";
      if (detectedConditions.length === 0) {
        summary =
          "✅ Your skin looks healthy!\n\nNo skin conditions detected. Keep up your skincare routine!";
      } else if (detectedConditions.length === 1) {
        summary = `🔍 Detected Condition:\n\n• ${detectedConditions[0]} (${confidenceScores[0]}% confidence)`;
      } else {
        summary = `🔍 Detected ${detectedConditions.length} Conditions:\n\n`;
        detectedConditions.forEach((condition, index) => {
          summary += `• ${condition} (${confidenceScores[index]}% confidence)\n`;
        });
        summary +=
          "\nTap 'View Routine' to see personalized skincare for all detected conditions.";
      }

      console.log("[Capture] Alert summary:", summary);

      // Show alert with detected conditions (web fallback using window.confirm)
      setLoading(false);
      if (Platform.OS === "web") {
        try {
          const confirmMsg = `${summary}\n\nClick OK to view routine, Cancel to retake.`;
          const view = window.confirm(confirmMsg);
          if (view) {
            console.log("[Capture] Navigating to results screen (web confirm)");
            try {
              await AsyncStorage.setItem(
                "lastAnalysis",
                JSON.stringify({ imageUri: photo, predictions: roboflowData }),
              );
            } catch (storageErr) {
              console.warn(
                "[Capture] Failed to write lastAnalysis to AsyncStorage",
                storageErr,
              );
            }
            router.push({
              pathname: "/camera/results",
              params: {
                imageUri: photo,
                predictions: JSON.stringify(roboflowData),
              },
            });
          } else {
            console.log("[Capture] User chose to retake (web confirm)");
            retake();
          }
        } catch (err) {
          // Fallback to native alert if window is not available
          console.warn(
            "[Capture] Web confirm failed, falling back to Alert:",
            err,
          );
          Alert.alert("Analysis Complete", summary, [
            {
              text: "View Routine",
              onPress: async () => {
                try {
                  await AsyncStorage.setItem(
                    "lastAnalysis",
                    JSON.stringify({
                      imageUri: photo,
                      predictions: roboflowData,
                    }),
                  );
                } catch (storageErr) {
                  console.warn(
                    "[Capture] Failed to write lastAnalysis to AsyncStorage",
                    storageErr,
                  );
                }
                router.push({
                  pathname: "/camera/results",
                  params: {
                    imageUri: photo,
                    predictions: JSON.stringify(roboflowData),
                  },
                });
              },
            },
            { text: "Retake", onPress: () => retake(), style: "cancel" },
          ]);
        }
      } else {
        Alert.alert("Analysis Complete", summary, [
          {
            text: "View Routine",
            onPress: () => {
              console.log("[Capture] Navigating to results screen");
              console.log("[Capture] Sending predictions:", roboflowData);
              router.push({
                pathname: "/camera/results",
                params: {
                  imageUri: photo,
                  predictions: JSON.stringify(roboflowData),
                },
              });
            },
          },
          {
            text: "Retake",
            onPress: () => {
              console.log("[Capture] User chose to retake");
              retake();
            },
            style: "cancel",
          },
        ]);
      }
    } catch (e: any) {
      setLoading(false);
      console.error("[Capture] Analysis error caught:", e);
      console.error("[Capture] Error message:", e.message);
      console.error("[Capture] Error stack:", e.stack);
      Alert.alert(
        "Analysis Failed",
        `Could not analyze the image: ${e.message || "Unknown error"}`,
        [{ text: "Try Again" }],
      );
    }
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={retake} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={analyze}
            style={styles.primaryBtn}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "Analyzing..." : "Analyze Photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.guideContainer}>
            <View style={styles.faceGuide} />
            <Text style={styles.guideText}>
              Align your face within the frame
            </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: { textAlign: "center", marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: RADIUS.m },
  btnText: { color: "#FFF", fontWeight: "bold" },

  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: "cover" },

  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: SPACING.l,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  header: { marginTop: SPACING.xl, alignItems: "flex-end" },

  guideContainer: { alignItems: "center" },
  faceGuide: {
    width: 250,
    height: 320,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: "#FFF",
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  guideText: {
    color: "#FFF",
    marginTop: SPACING.m,
    fontSize: 16,
    fontWeight: "500",
  },

  footer: { alignItems: "center", marginBottom: SPACING.xl },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
  },

  controlRow: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
    padding: 15,
    borderRadius: RADIUS.round,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#FFF",
    marginRight: 10,
    padding: 15,
    borderRadius: RADIUS.round,
    alignItems: "center",
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: "bold", fontSize: 16 },
});
