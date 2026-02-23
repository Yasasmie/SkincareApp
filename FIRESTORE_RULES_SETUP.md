# Firestore Security Rules Setup

## Problem

The app is encountering "Missing or insufficient permissions" errors when trying to read/write user data to Firestore. This is because Firestore security rules are not configured.

## Solution

Go to **Firebase Console** → **Your Project** → **Firestore Database** → **Rules** and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own user profile (top-level)
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;

      // Allow users to read/write their own analyses (nested collection)
      match /analyses/{analysisId} {
        allow read, write: if request.auth.uid == uid;
      }
    }

    // Allow users to manage consultations
    match /consultations/{consultationId} {
      allow read: if request.auth.uid == resource.data.userId || request.auth.uid == resource.data.dermatologistId;
      allow write: if request.auth.uid == resource.data.userId;
    }

    // Create new consultations
    match /consultations {
      allow create: if request.auth.uid != null;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Key Points

- Users can only read/write their own `/users/{uid}` document
- Analyses are stored in a **nested subcollection** under each user: `/users/{uid}/analyses/{analysisId}`
- Each analysis is automatically associated with the current user's UID
- Consultations require authentication to read/create
- All other access is denied by default

## Firestore Collection Structure

```
/users
  /{uid}  <- User profile (name, email, age, skinType, etc.)
    /analyses  <- Nested collection
      /{analysisId}  <- Each skin analysis
        detectedConditions: [...]
        healthScore: 85
        confidenceScores: [...]
        createdAt: timestamp

/consultations
  /{consultationId}  <- Consultation requests
```

## After Setting Rules

1. Click "Publish" to save the rules
2. Restart the app or clear browser cache
3. The permission denied errors should resolve

## Testing

1. **Define the rules** above in Firebase Console
2. **Create a new user account** in the app (sign up)
3. **Take a photo and analyze** - the analysis will be:
   - Automatically saved to `/users/{uid}/analyses/{analysisId}`
   - Tagged with the current user's UID
4. **View History** - tap "View in History" after analysis completes
5. **Check Firestore Console** to verify:
   - New collection: `/users/{your-uid}/analyses`
   - New document created with your analysis data
   - Each analysis has: `detectedConditions`, `healthScore`, `confidenceScores`, `createdAt`

## Debugging

If you see **"Missing or insufficient permissions"** errors:

1. Check that your **Firestore Rules** are published (green checkmark)
2. Verify the rules match the code above exactly
3. Make sure you're **authenticated** (signed in)
4. Clear browser cache if testing on web
5. Check Firestore Console → Data to see collection structure

If **"View in History" doesn't show data**:

1. Wait ~1-2 seconds after tapping "Analyze" (Firebase sync time)
2. Check browser console for any error messages
3. Verify you're viewing the same user account that created the analysis
4. Refresh the history screen (pull down or tap refresh icon)
