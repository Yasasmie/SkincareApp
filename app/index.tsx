import React from "react";
import { View, Text, StyleSheet, ImageBackground, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { MotionView } from "../components/MotionView";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAppTheme } from "../components/ThemeProvider";
import { AppColors, SPACING } from "../constants/theme";

const backgroundImage = require("../assets/images/homepic.jpg");
const { height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay}>
          <MotionView style={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 40 }}>🌿</Text>
            </View>

            <Text style={styles.title}>Glow AI</Text>
            <Text style={styles.subtitle}>
              Your personalized AI dermatologist in your pocket.
            </Text>

            <View style={styles.buttonContainer}>
              <PrimaryButton title="Get Started" onPress={() => router.push("/auth/login")} />
            </View>
          </MotionView>
        </View>
      </ImageBackground>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: "100%", height: "100%" },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
      paddingBottom: height * 0.1,
    },
    content: { padding: SPACING.xl, alignItems: "center", width: "100%" },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SPACING.l,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#FFF",
      marginBottom: SPACING.s,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 16,
      color: "#E0E0E0",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: SPACING.xl,
      maxWidth: "80%",
    },
    buttonContainer: { width: "100%", maxWidth: 300 },
  });
