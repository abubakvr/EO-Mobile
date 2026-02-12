import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_SIZE_BYTES = 500 * 1024; // 500KB

/**
 * Get file size in bytes, or null if unavailable.
 */
async function getFileSizeBytes(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return info.exists && typeof (info as any).size === 'number' ? (info as any).size : null;
  } catch {
    return null;
  }
}

/**
 * Compress an image to under 500KB. Returns the URI of the compressed image (or original if already small).
 * Call this immediately after the user captures/picks an image.
 */
export async function compressImageToMaxSize(
  imageUri: string,
  maxSizeBytes: number = MAX_SIZE_BYTES
): Promise<string> {
  const size = await getFileSizeBytes(imageUri);
  if (size != null && size <= maxSizeBytes) {
    return imageUri;
  }

  const steps: { width: number; compress: number }[] = [
    { width: 1600, compress: 0.7 },
    { width: 1200, compress: 0.6 },
    { width: 1000, compress: 0.5 },
    { width: 800, compress: 0.45 },
    { width: 600, compress: 0.4 },
    { width: 480, compress: 0.35 },
  ];

  let currentUri = imageUri;
  for (const { width, compress } of steps) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width } }],
        { compress, format: (ImageManipulator as any).SaveFormat?.JPEG ?? 'jpeg' }
      );
      const newUri = result.uri;
      const newSize = await getFileSizeBytes(newUri);
      if (newSize != null && newSize <= maxSizeBytes) {
        return newUri;
      }
      currentUri = newUri;
    } catch (e) {
      if (__DEV__) {
        console.warn('[imageCompression] Step failed:', width, compress, e);
      }
    }
  }

  // Last attempt: very aggressive
  try {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: 400 } }],
      { compress: 0.3, format: (ImageManipulator as any).SaveFormat?.JPEG ?? 'jpeg' }
    );
    return result.uri;
  } catch {
    return currentUri;
  }
}
