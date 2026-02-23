// services/analysisHistoryService.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export type SkinAnalysis = {
  id?: string;
  uid: string;
  imageUrl?: string;
  detectedConditions: string[];
  confidenceScores: number[];
  healthScore: number;
  recommendations: any[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
  saved?: boolean;
};

/**
 * Save an analysis to history (nested under user's document)
 */
export async function saveAnalysis(
  analysis: Omit<SkinAnalysis, "id" | "uid" | "createdAt" | "updatedAt">,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const now = Date.now();
    const analysisData: SkinAnalysis = {
      ...analysis,
      uid: user.uid,
      createdAt: now,
      updatedAt: now,
      saved: true,
    };

    // Save to /users/{uid}/analyses/{analysisId}
    const userAnalysesRef = collection(db, "users", user.uid, "analyses");
    const docRef = await addDoc(userAnalysesRef, analysisData);
    console.log(
      "[AnalysisHistory] Analysis saved to /users/" +
        user.uid +
        "/analyses/" +
        docRef.id,
    );
    return docRef.id;
  } catch (error) {
    console.error("[AnalysisHistory] Error saving analysis:", error);
    throw error;
  }
}

/**
 * Get user's analysis history from nested collection
 */
export async function getUserAnalysisHistory(
  maxResults: number = 50,
): Promise<SkinAnalysis[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    // Read from /users/{uid}/analyses
    const userAnalysesRef = collection(db, "users", user.uid, "analyses");
    const q = query(
      userAnalysesRef,
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );

    const snapshot = await getDocs(q);
    const analyses = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SkinAnalysis,
    );

    console.log(
      "[AnalysisHistory] Retrieved",
      analyses.length,
      "analyses for user from /users/" + user.uid + "/analyses",
    );
    return analyses;
  } catch (error) {
    console.error("[AnalysisHistory] Error fetching history:", error);
    return [];
  }
}

/**
 * Get recent analyses (last 7 days) from nested collection
 */
export async function getRecentAnalyses(): Promise<SkinAnalysis[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    // Read from /users/{uid}/analyses
    const userAnalysesRef = collection(db, "users", user.uid, "analyses");
    const q = query(
      userAnalysesRef,
      where("createdAt", ">=", sevenDaysAgo),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SkinAnalysis,
    );
  } catch (error) {
    console.error("[AnalysisHistory] Error fetching recent analyses:", error);
    return [];
  }
}

/**
 * Get analysis statistics
 */
export async function getAnalysisStats(): Promise<{
  totalAnalyses: number;
  recentAnalyses: number;
  mostCommonConditions: string[];
  averageHealthScore: number;
}> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    const analyses = await getUserAnalysisHistory(100);

    const conditionCounts: Record<string, number> = {};
    let totalScore = 0;

    analyses.forEach((analysis) => {
      totalScore += analysis.healthScore;
      analysis.detectedConditions.forEach((condition) => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      });
    });

    const mostCommonConditions = Object.entries(conditionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([condition]) => condition);

    const stats = {
      totalAnalyses: analyses.length,
      recentAnalyses: (await getRecentAnalyses()).length,
      mostCommonConditions,
      averageHealthScore:
        analyses.length > 0 ? Math.round(totalScore / analyses.length) : 100,
    };

    console.log("[AnalysisHistory] Stats calculated:", stats);
    return stats;
  } catch (error) {
    console.error("[AnalysisHistory] Error calculating stats:", error);
    return {
      totalAnalyses: 0,
      recentAnalyses: 0,
      mostCommonConditions: [],
      averageHealthScore: 100,
    };
  }
}

/**
 * Add notes to an analysis (nested in user's collection)
 */
export async function updateAnalysisNotes(
  analysisId: string,
  notes: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    // Update in /users/{uid}/analyses/{analysisId}
    const docRef = doc(db, "users", user.uid, "analyses", analysisId);
    await updateDoc(docRef, {
      notes,
      updatedAt: Date.now(),
    });
    console.log("[AnalysisHistory] Notes updated for analysis:", analysisId);
  } catch (error) {
    console.error("[AnalysisHistory] Error updating notes:", error);
    throw error;
  }
}

/**
 * Delete an analysis (from nested user collection)
 */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  try {
    // Delete from /users/{uid}/analyses/{analysisId}
    const docRef = doc(db, "users", user.uid, "analyses", analysisId);
    await deleteDoc(docRef);
    console.log("[AnalysisHistory] Analysis deleted:", analysisId);
  } catch (error) {
    console.error("[AnalysisHistory] Error deleting analysis:", error);
    throw error;
  }
}

/**
 * Get condition trend over time (from nested collection)
 */
export async function getConditionTrend(
  condition: string,
  days: number = 30,
): Promise<{ date: string; healthScore: number }[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");

  const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    // Query from /users/{uid}/analyses with date filter
    const userAnalysesRef = collection(db, "users", user.uid, "analyses");
    const q = query(
      userAnalysesRef,
      where("createdAt", ">=", startDate),
      orderBy("createdAt", "asc"),
    );

    const snapshot = await getDocs(q);
    const trend = snapshot.docs
      .map((doc) => {
        const data = doc.data() as SkinAnalysis;
        if (data.detectedConditions.includes(condition.toLowerCase())) {
          return {
            date: new Date(data.createdAt).toISOString().split("T")[0],
            healthScore: data.healthScore,
          };
        }
        return null;
      })
      .filter((item) => item !== null) as {
      date: string;
      healthScore: number;
    }[];

    console.log("[AnalysisHistory] Trend retrieved for condition:", condition);
    return trend;
  } catch (error) {
    console.error("[AnalysisHistory] Error fetching trend:", error);
    return [];
  }
}
