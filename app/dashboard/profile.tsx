import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../../components/ThemeProvider";
import { AppColors, RADIUS, SPACING } from "../../constants/theme";
import { auth, db } from "../../firebaseConfig";

function getSafeProfilePhoto(photo: string | null | undefined): string | null {
  if (!photo) {
    return null;
  }

  if (photo.startsWith("blob:")) {
    return null;
  }

  return photo;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (!user) {
            if (isMounted) {
              setLoading(false);
              router.replace("/auth/login");
            }
            return;
          }

          let data = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photo: getSafeProfilePhoto(user.photoURL),
            skinType: "Not Set",
          };

          if (isMounted) {
            setUserData(data);
            setImageLoadError(false);
            setLoading(false);
          }

          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const firestoreData = docSnap.data();
              data.skinType = firestoreData.skinType || "Not Set";
              if (firestoreData.fullName) data.name = firestoreData.fullName;
              if (firestoreData.photoURL) {
                data.photo = getSafeProfilePhoto(firestoreData.photoURL);
              } else if (firestoreData.photoData) {
                data.photo = getSafeProfilePhoto(firestoreData.photoData);
              }

              if (isMounted) {
                setUserData(data);
                setImageLoadError(false);
              }
            }
          } catch (firestoreError) {
            console.log("Firestore offline/error, showing basic auth data only:", firestoreError);
          }
        } catch (error) {
          console.error("Critical Profile Error:", error);
          if (isMounted) setLoading(false);
        }
      };

      setLoading(true);
      void fetchUserData();

      return () => {
        isMounted = false;
      };
    }, [router]),
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const MenuItem = ({
    icon,
    label,
    color = colors.text,
    onPress,
  }: {
    icon: string;
    label: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View
        style={[
          styles.menuIconBox,
          color === colors.error && { backgroundColor: colors.error + "18" },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={color === colors.text ? colors.primary : color}
        />
      </View>
      <Text style={[styles.menuText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {userData?.photo && !imageLoadError ? (
            <Image
              source={{ uri: userData.photo }}
              style={styles.avatar}
              onError={() => {
                console.warn("[Profile] Image failed to load, using fallback");
                setImageLoadError(true);
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={50} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{userData?.name || "User"}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeader}>Personal Details</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{userData?.name}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="water-outline" size={20} color={colors.primary} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>Skin Type</Text>
              <Text style={styles.infoValue}>{userData?.skinType}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Activity</Text>
        <View style={styles.card}>
          <MenuItem
            icon="time-outline"
            label="Analysis History"
            onPress={() => router.push("/dashboard/history")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="medical"
            label="Expert Help"
            onPress={() => router.push("/dashboard/consultation")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/dashboard/settings")}
          />
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert("Info", "Notifications settings.")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            color={colors.error}
            onPress={handleLogout}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { justifyContent: "center" },
    header: {
      backgroundColor: colors.header,
      paddingTop: 60,
      paddingBottom: 30,
      alignItems: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    backBtn: { position: "absolute", left: 20, top: 50 },
    avatarContainer: { marginBottom: 10 },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: "#FFF",
      backgroundColor: colors.muted,
    },
    defaultAvatar: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    name: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
    email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
    content: { padding: SPACING.l },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textLight,
      textTransform: "uppercase",
      marginTop: 10,
      marginBottom: SPACING.s,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      elevation: 2,
      marginBottom: SPACING.m,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
    infoBody: { marginLeft: 15 },
    infoLabel: { fontSize: 12, color: colors.textSecondary },
    infoValue: { fontSize: 16, color: colors.text, fontWeight: "500" },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
    menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
    menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + "14",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    menuText: { flex: 1, fontSize: 16, fontWeight: "500", color: colors.text },
  });
