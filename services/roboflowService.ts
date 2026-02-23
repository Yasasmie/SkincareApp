// services/roboflowService.ts
import * as FileSystem from "expo-file-system/legacy";

const ROBOFLOW_API_KEY = "iqKdEJjCaglhj9UmoiC2";
const ROBOFLOW_MODEL = "skindisease-2qko0";
const ROBOFLOW_VERSION = 1;

const ROBOFLOW_ENDPOINT = `https://serverless.roboflow.com/${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}`;

// Add request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

export type RoboflowPrediction = {
  class: string;
  confidence: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type RoboflowResponse = {
  predictions: RoboflowPrediction[];
  model_id: string;
  image_id: string;
  visualization: string;
};

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Convert Blob to Base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send image to Roboflow for skin disease detection
 */
export async function detectSkinDisease(
  imagePath: string,
): Promise<RoboflowResponse> {
  console.log("[Roboflow] Starting detection with image:", imagePath);
  console.log("[Roboflow] Endpoint:", ROBOFLOW_ENDPOINT);

  try {
    // Read image as base64 (works on both web and native)
    console.log("[Roboflow] Reading image...");

    let base64: string;

    // Determine if we're on web or native
    const isWeb = typeof window !== "undefined";

    if (isWeb) {
      // Web: Use fetch to get the image as blob
      console.log("[Roboflow] Platform: Web - using fetch");
      const response = await fetch(imagePath);
      const blob = await response.blob();
      console.log("[Roboflow] Blob size:", blob.size);

      base64 = await blobToBase64(blob);
      console.log(
        "[Roboflow] Base64 converted successfully, length:",
        base64.length,
      );
    } else {
      // Native: Use FileSystem
      console.log("[Roboflow] Platform: Native - using FileSystem");
      base64 = await FileSystem.readAsStringAsync(imagePath, {
        encoding: "base64",
      });
      console.log(
        "[Roboflow] Base64 read successfully, length:",
        base64.length,
      );
    }

    // Send as base64 to Roboflow
    console.log("[Roboflow] Sending request to Roboflow API...");
    const apiUrl = `${ROBOFLOW_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`;
    console.log("[Roboflow] API URL:", apiUrl);

    const apiResponse = await fetchWithTimeout(
      apiUrl,
      {
        method: "POST",
        body: base64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      REQUEST_TIMEOUT,
    );

    console.log("[Roboflow] Response status:", apiResponse.status);
    console.log(
      "[Roboflow] Response headers:",
      JSON.stringify(apiResponse.headers),
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        "[Roboflow] Error response:",
        apiResponse.status,
        errorText,
      );

      // Provide helpful error messages for common issues
      let errorMessage = `Roboflow API error: ${apiResponse.status} - ${errorText}`;

      if (apiResponse.status === 403) {
        errorMessage =
          "❌ Access Forbidden (403)\n\n" +
          "Possible causes:\n" +
          "1. API key is invalid or expired\n" +
          "2. Model is not published/deployed on Roboflow\n" +
          "3. API key doesn't have access to this model\n\n" +
          "✅ Fix:\n" +
          "- Open your Roboflow workspace\n" +
          "- Go to your 'skindisease-2qko0' model\n" +
          "- Click 'Deploy' tab\n" +
          "- Make sure it's marked as 'Published'\n" +
          "- Copy the correct API key and model name\n" +
          "- Update them in services/roboflowService.ts";
      } else if (apiResponse.status === 404) {
        errorMessage =
          "❌ Model Not Found (404)\n\n" +
          "The model 'skindisease-2qko0' version 1 doesn't exist.\n\n" +
          "✅ Fix:\n" +
          "- Verify model name in Roboflow\n" +
          "- Check version number (currently using version 1)\n" +
          "- Make sure model is published";
      } else if (apiResponse.status === 401) {
        errorMessage =
          "❌ Unauthorized (401)\n\n" +
          "API key is missing or invalid.\n\n" +
          "✅ Fix:\n" +
          "- Get API key from Roboflow dashboard\n" +
          "- Update ROBOFLOW_API_KEY in services/roboflowService.ts";
      }

      throw new Error(errorMessage);
    }

    const data: RoboflowResponse = await apiResponse.json();
    console.log(
      "[Roboflow] Detection successful:",
      data.predictions?.length || 0,
      "conditions found",
    );
    console.log("[Roboflow] Full response:", JSON.stringify(data, null, 2));

    // Log each prediction's fields for debugging
    if (data.predictions && data.predictions.length > 0) {
      console.log(
        "[Roboflow] First prediction object:",
        JSON.stringify(data.predictions[0], null, 2),
      );
      data.predictions.forEach((pred, idx) => {
        console.log(
          `[Roboflow] Prediction ${idx}:`,
          "class=",
          (pred as any).class,
          "confidence=",
          (pred as any).confidence,
          "x=",
          (pred as any).x,
          "y=",
          (pred as any).y,
        );
      });
    }

    return data;
  } catch (error: any) {
    console.error("[Roboflow] Detection failed:", error.message);
    if (error.name === "AbortError") {
      console.error("[Roboflow] Request timeout after", REQUEST_TIMEOUT, "ms");
      throw new Error(
        "Request timeout: Analysis took too long. Please check your internet connection or try again.",
      );
    }
    throw error;
  }
}
