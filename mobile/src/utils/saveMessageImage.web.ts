import { RefObject } from 'react';
import { View } from 'react-native';

// expo-media-library has no web implementation, so importing it (as the
// native version of this file does) crashes the whole web bundle at module
// eval — Metro/Expo picks this .web.ts file over saveMessageImage.ts for web
// builds automatically, keeping native behavior untouched.
export async function saveMessageImage(
  _ref: RefObject<View | null>
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Saving images is not supported on web — try the app.' };
}
