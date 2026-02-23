import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { sendPasswordResetEmail, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { auth, db } from "../../firebaseConfig";
import { uploadAndSaveProfileImage } from "../../services/firebaseUserService";

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSkinType, setEditSkinType] = useState("");

  // Password Reset State
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

          // 1. Start with Basic Auth Data (Always available if logged in)
          let data = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photo: user.photoURL || null,
            skinType: "Not Set",
          };

          // 2. Try to get Extra Data from Firestore
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const firestoreData = docSnap.data();
              data.skinType = firestoreData.skinType || "Not Set";
              if (firestoreData.fullName) data.name = firestoreData.fullName;
              // Prefer a persisted Storage URL, otherwise fall back to stored dataURL (web fallback)
              if (firestoreData.photoURL) data.photo = firestoreData.photoURL;
              else if (firestoreData.photoData)
                data.photo = firestoreData.photoData;
            }
          } catch (firestoreError) {
            console.log(
              "Firestore offline/error, showing basic auth data only:",
              firestoreError,
            );
            // We do NOT crash here. We just continue showing the basic data we have.
          }

          if (isMounted) {
            setUserData(data);
            setEditName(data.name || "");
            setEditSkinType(data.skinType);
            setImageLoadError(false); // Reset image error when new data loads
            setLoading(false);
          }
        } catch (error) {
          console.error("Critical Profile Error:", error);
          if (isMounted) setLoading(false);
        }
      };

      setLoading(true);
      fetchUserData();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      let pickedUri = result.assets[0].uri;

      // On web, ImagePicker may return a blob: URL which is ephemeral and can
      // cause net::ERR_FILE_NOT_FOUND when later rendered. Convert to a data URL
      // immediately so it persists in the UI and can be uploaded.
      const isWeb = typeof window !== "undefined" && !!window.document;
      let previewUri = pickedUri;

      if (isWeb) {
        try {
          const resp = await fetch(pickedUri);
          const blob = await resp.blob();
          previewUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed reading blob"));
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (convErr) {
          console.warn(
            "[Profile] Failed converting picked blob to dataURL:",
            convErr,
          );
          // fallback to the original URI (will trigger onError which shows default avatar)
          previewUri = pickedUri;
        }
      }

      // Show optimistic preview
      setUserData({ ...userData, photo: previewUri });
      setImageLoadError(false);

      if (auth.currentUser) {
        setLoading(true);
        try {
          const downloadUrl = await uploadAndSaveProfileImage(previewUri);
          // set persisted cloud URL or dataURL (upload helper returns dataURL on web fallback)
          setUserData((prev: any) => ({ ...prev, photo: downloadUrl }));
        } catch (e) {
          console.log("Upload failed, keeping local preview:", e);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: editName });

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          fullName: editName,
          skinType: editSkinType,
        });
      } catch (dbError) {
        console.log("Firestore update failed (offline?), ignoring.");
      }

      setUserData({ ...userData, name: editName, skinType: editSkinType });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error: any) {
      Alert.alert("Error", "Could not update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userData?.email) return;
    try {
      await sendPasswordResetEmail(auth, userData.email);
      Alert.alert(
        "Email Sent",
        "Check your email for a link to reset your password.",
      );
      setShowPasswordModal(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const MenuItem = ({
    icon,
    label,
    color = COLORS.text,
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
          color === COLORS.error && { backgroundColor: "#FFF0F0" },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={color === COLORS.text ? COLORS.primary : color}
        />
      </View>
      <Text style={[styles.menuText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
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
              <Ionicons name="person" size={50} color="#CCC" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{userData?.name || "User"}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeader}>Personal Details</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          {isEditing ? (
            <View>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.label}>Skin Type</Text>
              <View style={styles.row}>
                {["Normal", "Oily", "Dry", "Combination"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      editSkinType === type && styles.chipSelected,
                    ]}
                    onPress={() => setEditSkinType(type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editSkinType === type && { color: "#FFF" },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={{ padding: 10 }}
                >
                  <Text style={{ color: "#999" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveProfile} style={styles.saveBtn}>
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{userData?.name}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons
                  name="water-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.infoLabel}>Skin Type</Text>
                  <Text style={styles.infoValue}>{userData?.skinType}</Text>
                </View>
              </View>
            </View>
          )}
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
            icon="person-circle"
            label="Update Profile"
            onPress={() => router.push("/forms/userdetails")}
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
            onPress={() =>
              Alert.alert(
                "Settings",
                "Settings are available in a future update.",
              )
            }
          />
        </View>

        <Text style={styles.sectionHeader}>Security</Text>
        <View style={styles.card}>
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert("Info", "Notifications settings.")}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            color={COLORS.error}
            onPress={handleLogout}
          />
        </View>
      </View>

      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalText}>
              We will send a password reset link to:
            </Text>
            <Text style={styles.modalEmail}>{userData?.email}</Text>

            <PrimaryButton
              title="Send Reset Link"
              onPress={handleChangePassword}
            />
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: "#999" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: "#F0F0F0",
  },
  defaultAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  content: { padding: SPACING.l },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textLight,
    textTransform: "uppercase",
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    elevation: 2,
    marginBottom: SPACING.m,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoLabel: { fontSize: 12, color: "#999" },
  infoValue: { fontSize: 16, color: COLORS.text, fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 4 },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 5 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
  },
  chipSelected: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.text },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F9F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuText: { flex: 1, fontSize: 16, fontWeight: "500", color: COLORS.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalText: { color: "#666", marginBottom: 5 },
  modalEmail: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
});
