// services/consultationService.ts
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export type ConsultationRequest = {
  id?: string;
  uid: string;
  email: string;
  title: string;
  description: string;
  detectedConditions: string[];
  severity: "low" | "medium" | "high";
  attachedAnalysisId?: string;
  status: "pending" | "in-progress" | "resolved" | "closed";
  response?: string;
  respondedBy?: string;
  respondedAt?: number;
  createdAt: number;
  updatedAt: number;
  isUrgent?: boolean;
};

/**
 * Create a consultation request
 */
export async function createConsultationRequest(
  data: Omit<
    ConsultationRequest,
    "id" | "uid" | "email" | "status" | "createdAt" | "updatedAt"
  >,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const now = Date.now();
    const consultationData: ConsultationRequest = {
      ...data,
      uid: user.uid,
      email: user.email || "",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      isUrgent: data.severity === "high" || data.detectedConditions.length > 3,
    };

    const docRef = await addDoc(
      collection(db, "consultations"),
      consultationData,
    );

    console.log("[Consultation] Request created with ID:", docRef.id);

    // Auto-alert experts if urgent
    if (consultationData.isUrgent) {
      await alertExpertsOfUrgentCase(docRef.id, consultationData);
    }

    return docRef.id;
  } catch (error) {
    console.error("[Consultation] Error creating consultation request:", error);
    throw error;
  }
}

/**
 * Get user's consultation requests
 */
export async function getUserConsultations(): Promise<ConsultationRequest[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const q = query(
      collection(db, "consultations"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    const consultations = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ConsultationRequest,
    );

    console.log(
      "[Consultation] Retrieved",
      consultations.length,
      "consultations",
    );
    return consultations;
  } catch (error) {
    console.error("[Consultation] Error fetching consultations:", error);
    return [];
  }
}

/**
 * Get pending consultations (for admin/experts)
 */
export async function getPendingConsultations(): Promise<
  ConsultationRequest[]
> {
  try {
    const q = query(
      collection(db, "consultations"),
      where("status", "==", "pending"),
      orderBy("isUrgent", "desc"),
      orderBy("createdAt", "asc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ConsultationRequest,
    );
  } catch (error) {
    console.error(
      "[Consultation] Error fetching pending consultations:",
      error,
    );
    return [];
  }
}

/**
 * Get urgent consultations (high severity or multiple conditions)
 */
export async function getUrgentConsultations(): Promise<ConsultationRequest[]> {
  try {
    const q = query(
      collection(db, "consultations"),
      where("isUrgent", "==", true),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ConsultationRequest,
    );
  } catch (error) {
    console.error("[Consultation] Error fetching urgent consultations:", error);
    return [];
  }
}

/**
 * Respond to a consultation request (expert only)
 */
export async function respondToConsultation(
  consultationId: string,
  response: string,
  status: "in-progress" | "resolved" = "resolved",
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const docRef = doc(db, "consultations", consultationId);
    await updateDoc(docRef, {
      response,
      status,
      respondedBy: user.email,
      respondedAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(
      "[Consultation] Response added to consultation:",
      consultationId,
    );
  } catch (error) {
    console.error("[Consultation] Error responding to consultation:", error);
    throw error;
  }
}

/**
 * Update consultation status
 */
export async function updateConsultationStatus(
  consultationId: string,
  status: ConsultationRequest["status"],
): Promise<void> {
  try {
    const docRef = doc(db, "consultations", consultationId);
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });

    console.log(
      "[Consultation] Status updated to",
      status,
      "for:",
      consultationId,
    );
  } catch (error) {
    console.error("[Consultation] Error updating consultation status:", error);
    throw error;
  }
}

/**
 * Auto-alert experts of urgent cases
 * In production, this would integrate with email/notification service
 */
async function alertExpertsOfUrgentCase(
  consultationId: string,
  consultation: ConsultationRequest,
): Promise<void> {
  try {
    console.log("[Consultation] 🚨 URGENT ALERT");
    console.log("[Consultation] Consultation ID:", consultationId);
    console.log("[Consultation] User Email:", consultation.email);
    console.log("[Consultation] Title:", consultation.title);
    console.log(
      "[Consultation] Conditions:",
      consultation.detectedConditions.join(", "),
    );
    console.log("[Consultation] Severity:", consultation.severity);

    // TODO: Integrate with email service (SendGrid, Firebase Cloud Functions, etc)
    // Example:
    // await sendEmailToExperts({
    //   subject: `🚨 URGENT: New Consultation Request - ${consultation.title}`,
    //   consultation,
    // });

    // TODO: Send push notification to admin app
    // await sendPushNotificationToAdmins(consultationId);
  } catch (error) {
    console.error("[Consultation] Error alerting experts:", error);
  }
}

/**
 * Get consultation details
 */
export async function getConsultationDetails(
  consultationId: string,
): Promise<ConsultationRequest | null> {
  try {
    const docRef = doc(db, "consultations", consultationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ConsultationRequest;
    }

    return null;
  } catch (error) {
    console.error("[Consultation] Error fetching consultation details:", error);
    return null;
  }
}

/**
 * Get consultation statistics (for admin)
 */
export async function getConsultationStats(): Promise<{
  total: number;
  pending: number;
  urgent: number;
  resolved: number;
  averaged_response_time: number;
}> {
  try {
    // Get all consultations (admin view)
    const allQuery = query(collection(db, "consultations"));
    const allSnapshot = await getDocs(allQuery);
    const all = allSnapshot.docs.map(
      (doc) => doc.data() as ConsultationRequest,
    );

    const pending = all.filter((c) => c.status === "pending").length;
    const resolved = all.filter((c) => c.status === "resolved").length;
    const urgent = all.filter((c) => c.isUrgent).length;

    // Calculate average response time
    let totalResponseTime = 0;
    let resolvedCount = 0;

    all.forEach((c) => {
      if (c.respondedAt && c.createdAt) {
        totalResponseTime += c.respondedAt - c.createdAt;
        resolvedCount++;
      }
    });

    const avgResponseTime =
      resolvedCount > 0
        ? Math.round(totalResponseTime / resolvedCount / (1000 * 60))
        : 0; // in minutes

    return {
      total: all.length,
      pending,
      urgent,
      resolved,
      averaged_response_time: avgResponseTime,
    };
  } catch (error) {
    console.error("[Consultation] Error fetching consultation stats:", error);
    return {
      total: 0,
      pending: 0,
      urgent: 0,
      resolved: 0,
      averaged_response_time: 0,
    };
  }
}
