import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export type UserNotification = {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: "consultation_reply" | "general";
  consultationId?: string;
  read: boolean;
  createdAt: number;
};

export async function createNotification(
  data: Omit<UserNotification, "id" | "createdAt" | "read">,
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: Date.now(),
  });
}

export async function getCurrentUserNotifications(): Promise<UserNotification[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as UserNotification,
    );
  } catch (indexedQueryError) {
    console.warn(
      "[Notifications] Indexed query failed, falling back:",
      indexedQueryError,
    );

    const fallbackQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
    );
    const snapshot = await getDocs(fallbackQuery);

    return snapshot.docs
      .map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as UserNotification,
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(db, "notifications", notificationId));
}

export async function clearCurrentUserNotifications(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", user.uid),
  );
  const snapshot = await getDocs(q);

  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}
