import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const ROBOFLOW_API_KEY = "iqKdEJjCaglhj9UmoiC2";
const ROBOFLOW_MODEL = "skindisease-2qko0";
const ROBOFLOW_VERSION = 1;
const ROBOFLOW_ENDPOINT = `https://detect.roboflow.com/${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}`;
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

function getFileNameFromPath(imagePath: string): string {
  const parts = imagePath.split(/[\\/]/);
  const lastPart = parts[parts.length - 1] || "skin-photo.jpg";
  return lastPart.includes(".") ? lastPart : `${lastPart}.jpg`;
}

function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

async function createUploadBody(imagePath: string): Promise<FormData | string> {
  const fileName = getFileNameFromPath(imagePath);
  const mimeType = getMimeType(fileName);

  if (Platform.OS === "web") {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append("file", blob, fileName);
    return formData;
  }

  const fileInfo = await FileSystem.getInfoAsync(imagePath);
  if (!fileInfo.exists) {
    throw new Error("Selected image could not be read from the device.");
  }

  const formData = new FormData();
  formData.append(
    "file",
    {
      uri: imagePath,
      name: fileName,
      type: mimeType,
    } as any,
  );

  return formData;
}

function getRequestHeaders(body: FormData | string): HeadersInit {
  if (typeof body === "string") {
    return {
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  return {};
}

function buildHelpfulError(status: number, errorText: string): string {
  if (status === 403) {
    return (
      "Access Forbidden (403)\n\n" +
      "Possible causes:\n" +
      "1. API key is invalid or expired\n" +
      "2. Model is not published/deployed on Roboflow\n" +
      "3. API key does not have access to this model\n\n" +
      "Fix:\n" +
      "- Open your Roboflow workspace\n" +
      "- Go to the Deploy tab for your model\n" +
      "- Confirm the model ID and version are correct\n" +
      "- Confirm this API key has inference access"
    );
  }

  if (status === 404) {
    return (
      "Model Not Found (404)\n\n" +
      `The model '${ROBOFLOW_MODEL}' version ${ROBOFLOW_VERSION} was not found.\n\n` +
      "Fix:\n" +
      "- Verify the model name and version in Roboflow\n" +
      "- Make sure the model is published"
    );
  }

  if (status === 401) {
    return (
      "Unauthorized (401)\n\n" +
      "The Roboflow API key is missing or invalid.\n\n" +
      "Fix:\n" +
      "- Copy the inference API key from the Roboflow dashboard\n" +
      "- Update ROBOFLOW_API_KEY in services/roboflowService.ts"
    );
  }

  return `Roboflow API error: ${status} - ${errorText}`;
}

export async function detectSkinDisease(
  imagePath: string,
): Promise<RoboflowResponse> {
  console.log("[Roboflow] Starting detection with image:", imagePath);
  console.log("[Roboflow] Endpoint:", ROBOFLOW_ENDPOINT);

  try {
    const body = await createUploadBody(imagePath);
    const apiUrl = `${ROBOFLOW_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`;
    console.log("[Roboflow] Sending request to Roboflow API...");

    const apiResponse = await fetchWithTimeout(
      apiUrl,
      {
        method: "POST",
        body,
        headers: getRequestHeaders(body),
      },
      REQUEST_TIMEOUT,
    );

    console.log("[Roboflow] Response status:", apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        "[Roboflow] Error response:",
        apiResponse.status,
        errorText,
      );
      throw new Error(buildHelpfulError(apiResponse.status, errorText));
    }

    const data = (await apiResponse.json()) as RoboflowResponse;
    console.log(
      "[Roboflow] Detection successful:",
      data.predictions?.length || 0,
      "conditions found",
    );
    console.log("[Roboflow] Full response:", JSON.stringify(data, null, 2));

    return data;
  } catch (error: any) {
    console.error("[Roboflow] Detection failed:", error?.message || error);

    if (error?.name === "AbortError") {
      throw new Error(
        "Request timeout: Analysis took too long. Please check your internet connection or try again.",
      );
    }

    throw error;
  }
}
