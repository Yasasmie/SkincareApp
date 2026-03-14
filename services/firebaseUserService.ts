// services/firebaseUserService.ts
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { Platform } from "react-native";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app, auth, db } from "../firebaseConfig";

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  age?: number;
  gender?: "male" | "female" | "other";
  skinType?: "oily" | "dry" | "combination" | "normal" | "sensitive";
  skinConcerns?: string[];
  photoURL?: string;
  photoData?: string;
  createdAt: number;
  updatedAt: number;
  isAdmin?: boolean;
};

/**
 * Create or update user profile in Firestore
 */
export async function createOrUpdateUserProfile(
  userData: Partial<UserProfile>,
): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const userRef = doc(db, "users", user.uid);
  const now = Date.now();

  const profileData: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || userData.name || "User",
    age: userData.age,
    gender: userData.gender,
    skinType: userData.skinType,
    skinConcerns: userData.skinConcerns || [],
    photoURL: user.photoURL || userData.photoURL,
    createdAt: userData.createdAt || now,
    updatedAt: now,
    isAdmin: userData.isAdmin || false,
  };

  await setDoc(userRef, profileData, { merge: true });
  console.log("[UserService] Profile created/updated for:", user.uid);
  return profileData;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("[UserService] No user logged in");
    return null;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      console.log("[UserService] Profile retrieved:", docSnap.data());
      return docSnap.data() as UserProfile;
    } else {
      console.log("[UserService] Creating new profile");
      return await createOrUpdateUserProfile({
        name: user.displayName || "User",
        email: user.email || "",
      });
    }
  } catch (error: any) {
    console.error(
      "[UserService] Error fetching profile:",
      error?.message || error,
    );
    return null;
  }
}

/**
 * Get user profile with fallback - safe for offline/permission scenarios
 */
export async function getUserProfileSafe(): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) {
    console.log("[UserService] No user logged in for safe profile");
    return {
      uid: "unknown",
      email: "",
      name: "User",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      console.log("[UserService] Profile retrieved (safe):", docSnap.data());
      return docSnap.data() as UserProfile;
    } else {
      console.log(
        "[UserService] No profile found, will create on first update",
      );
      return {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  } catch (error: any) {
    console.warn(
      "[UserService] Error fetching profile (safe fallback):",
      error?.message,
    );
    // Return safe default on any error (offline, permission denied, etc.)
    return {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "User",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

/**
 * Update specific user profile fields
 */
export async function updateUserProfile(
  updates: Partial<UserProfile>,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
  console.log("[UserService] Profile updated");
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as UserProfile;

  if (!userData?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const usersCollection = collection(db, "users");
  const snapshot = await getDocs(usersCollection);
  const users = snapshot.docs.map((doc) => doc.data() as UserProfile);
  console.log("[UserService] Retrieved", users.length, "users");
  return users;
}

/**
 * Get user by email (admin only)
 */
export async function getUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("[UserService] User not found with email:", email);
    return null;
  }

  return snapshot.docs[0].data() as UserProfile;
}

/**
 * Check if current user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.isAdmin || false;
}

/**
 * Promote user to admin (owner only)
 */
export async function promoteUserToAdmin(email: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("User not found");

  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, { isAdmin: true });
  console.log("[UserService] User promoted to admin:", email);
}

/**
 * Upload profile image to Firebase Storage and save URL to Auth + Firestore
 */
export async function uploadAndSaveProfileImage(uri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const isWeb = Platform.OS === "web";

    // Avoid Firebase Storage CORS failures on web by persisting a data URL directly.
    if (isWeb) {
      let dataUrl = uri;

      if (!uri.startsWith("data:")) {
        const response = await fetch(uri);
        const blob = await response.blob();
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "User",
            photoData: dataUrl,
            photoURL: null,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      } catch (firestoreErr) {
        console.warn(
          "[UserService] Failed to save web profile image to Firestore:",
          firestoreErr,
        );
        throw firestoreErr;
      }

      console.log("[UserService] Saved profile image as web dataURL");
      return dataUrl;
    }

    const storage = getStorage(app);
    const fileName = `users/${user.uid}/profile_${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);

    // Fetch the file as blob (native path)
    const response = await fetch(uri);
    const blob = await response.blob();

    try {
      const snapshot = await uploadBytes(storageRef, blob as any);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth profile
      try {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(user, { photoURL: downloadUrl });
      } catch (authErr) {
        console.warn(
          "[UserService] Failed to update Auth profile photo:",
          authErr,
        );
      }

      // Update Firestore user doc
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          photoURL: downloadUrl,
          photoData: null,
          updatedAt: Date.now(),
        });
      } catch (fsErr) {
        console.warn(
          "[UserService] Failed to update Firestore user photo:",
          fsErr,
        );
      }

      console.log(
        "[UserService] Uploaded profile image and saved URL:",
        downloadUrl,
      );
      return downloadUrl;
    } catch (uploadErr: any) {
      console.warn(
        "[UserService] Storage upload failed:",
        uploadErr,
      );
      throw uploadErr;
    }

  } catch (error) {
    console.error("[UserService] Error uploading profile image:", error);
    throw error;
  }
}

/**
 * Delete user data (admin only)
 */
export async function deleteUserData(uid: string): Promise<void> {
  const currentUser = await getUserProfile();
  if (!currentUser?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    isDeleted: true,
    deletedAt: Date.now(),
  });
  console.log("[UserService] User data marked as deleted:", uid);
}
