import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

// shareMessageImage (expo-sharing) removed 2026-08-20 — decision from
// that review: sharing happens from the person's own gallery, after the
// fact, once the image is already saved and they've had a moment with
// it — not a second competing action inside the app. See
// LongPressToSave.tsx for the current save-only flow.
export async function saveMessageImage(
  ref: RefObject<View | null>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: "Photos access is needed to save it — check Settings." };
    }

    const uri = await captureRef(ref, { format: 'png', quality: 1 });
    await MediaLibrary.Asset.create(uri);
    return { success: true };
  } catch {
    return { success: false, error: 'Something went wrong saving the image.' };
  }
}
