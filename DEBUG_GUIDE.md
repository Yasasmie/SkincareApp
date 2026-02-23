# Debugging Guide: Analyze Photo Not Responding

## 🔍 How to Debug

### Step 1: Check Console Logs

Open your Expo terminal and look for logs starting with `[Capture]` or `[Roboflow]` when you click "Analyze Photo".

**Expected console output sequence:**

```
[Capture] Analyze button pressed
[Capture] Loading state set to true
[Capture] Photo URI: file://...
[Roboflow] Starting detection with image: file://...
[Roboflow] Endpoint: https://detect.roboflow.com/skindisease-2qko0/1?api_key=rf_z7tho4i1NeYp8sfgFfBdodvHsHn1
[Roboflow] Reading image as base64...
[Roboflow] Base64 read successfully, length: XXXXX
[Roboflow] Sending request to Roboflow API...
[Roboflow] Response status: 200
[Roboflow] Detection successful: X conditions found
[Capture] Roboflow response received: {...}
[Capture] Navigating to results screen
```

### Step 2: Check What Might Be Wrong

**If you see:**

- ❌ **Nothing in console** → Button click not being detected
  - Solution: Check if the button is actually clickable (not disabled)
  - Verify `onPress` event is properly bound

- ❌ **`[Capture] Analyze button pressed` but then stops** → Image might be corrupted or permission issue
  - Solution: Check file system permissions
  - Try with a different image

- ❌ **`[Roboflow] Response status: 401` or `403`** → API key is invalid/expired
  - Solution: Verify Roboflow API key in`services/roboflowService.ts`
  - Check if model is published on Roboflow

- ❌ **`[Roboflow] Response status: 404`** → Model not found
  - Solution: Verify model name: `skindisease-2qko0`
  - Verify model version: `1`
  - Check your Roboflow workspace

- ❌ **Request timeout after 30000ms** → API is slow or unresponsive
  - Solution: Check internet connection
  - Try increasing timeout (modify `REQUEST_TIMEOUT` in roboflowService.ts)
  - Check Roboflow server status

- ❌ **`Analysis Failed` alert with error message** → Read the error message carefully
  - Screenshot and check logs above

---

## 🧪 Quick Test Steps

1. **Allow camera permissions** when prompted
2. **Take a photo** (click capture button)
3. **Click "Analyze Photo"** button
4. **Check console terminal** for logs (described above)

---

## ⚙️ Key Configuration to Verify

### File: `services/roboflowService.ts`

```typescript
const ROBOFLOW_API_KEY = "rf_z7tho4i1NeYp8sfgFfBdodvHsHn1"; // ← Verify this
const ROBOFLOW_MODEL = "skindisease-2qko0"; // ← Must match your model
const ROBOFLOW_VERSION = 1; // ← Check your version
const REQUEST_TIMEOUT = 30000; // ← 30 seconds
```

### How to Verify Settings:

1. Go to your **Roboflow workspace**
2. Click on your model (skindisease)
3. Click "Deploy"
4. Copy the **full API endpoint URL**
5. Extract:
   - API Key (starts with `rf_`)
   - Model name (between slashes)
   - Version number

---

## 🔗 Test API Directly (Optional)

If you want to test the Roboflow API independently:

```bash
# Replace with your values
curl -X POST "https://detect.roboflow.com/skindisease-2qko0/1?api_key=YOUR_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/image.jpg
```

Expected response:

```json
{
  "predictions": [
    {
      "class": "acne",
      "confidence": 0.92,
      "x": 150,
      "y": 200,
      "width": 100,
      "height": 100
    }
  ],
  "model_id": "skindisease-2qko0/1",
  "image_id": "...",
  "visualization": "..."
}
```

---

## 📱 What to Check in Your Phone/Emulator

1. **Is internet connection working?**
   - Try loading a website in browser first
2. **Are file permissions allowed?**
   - Camera ✓
   - File system ✓
3. **Can you take a photo?**
   - If not, camera permission issue
4. **Does the "Analyze Photo" button show loading state?**
   - If yes, API request is being made
   - If no, button click not working

---

## 🆘 Still Not Working?

Try this isolation test - add temporary debug code to `app/camera/capture.tsx`:

```tsx
// Add this after setLoading(true)
console.log("TEST: Button works!");
console.log("TEST: Photo exists:", !!photo);
console.log("TEST: Loading state:", loading);
```

Then click the button and check if these logs appear.

---

## 💡 Common Issues & Fixes

| Issue                     | Cause                    | Fix                                       |
| ------------------------- | ------------------------ | ----------------------------------------- |
| Button doesn't respond    | Touch event not captured | Restart app with `npx expo start --clear` |
| API 401 error             | Invalid/expired API key  | Get new key from Roboflow dashboard       |
| API 404 error             | Wrong model name/version | Double-check Roboflow model settings      |
| Timeout error             | Internet too slow        | Check WiFi/mobile connection              |
| Navigation doesn't happen | Empty predictions array  | Check Roboflow response format            |
| Results screen crashes    | Parsing error            | Check console for `[Results]` logs        |

---

## 📊 Success Indicators

When working correctly, you should see:

✅ App doesn't crash when clicking analyze  
✅ Console shows `[Roboflow]` logs  
✅ Response status is `200`  
✅ "Detection successful" message in console  
✅ Navigate to results screen  
✅ See detected conditions + routines

Let me know what logs you see and I'll help diagnose further!
