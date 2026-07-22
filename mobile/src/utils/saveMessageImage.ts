import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

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

export async function shareMessageImage(ref: RefObject<View | null>): Promise<void> {
  const uri = await captureRef(ref, { format: 'png', quality: 1 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}
