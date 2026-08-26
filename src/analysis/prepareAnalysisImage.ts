import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export type PreparedAnalysisImage = {
  dataUrl: string;
  width: number;
  height: number;
  temporaryUri?: string;
};

export async function prepareAnalysisImage(
  uri: string,
  width: number,
  height: number,
  maxDimension = 1280,
  compress = 0.72,
): Promise<PreparedAnalysisImage> {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  const longestSide = Math.max(width || 0, height || 0);

  if (longestSide > maxDimension && width > 0 && height > 0) {
    if (width >= height) {
      context.resize({ width: maxDimension, height: null });
    } else {
      context.resize({ width: null, height: maxDimension });
    }
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    base64: true,
    compress,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  if (!saved.base64) {
    throw new Error('Could not prepare image bytes for local analysis.');
  }

  return {
    dataUrl: `data:image/jpeg;base64,${saved.base64}`,
    width: saved.width,
    height: saved.height,
    temporaryUri: saved.uri,
  };
}

export function cleanupTemporaryUri(uri?: string | null) {
  if (!uri || Platform.OS === 'web' || !uri.startsWith('file://')) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cache cleanup is best-effort and must never interrupt camera or analysis UX.
  }
}
