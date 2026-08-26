import * as ImageManipulator from 'expo-image-manipulator';
import { cleanupTemporaryUri } from './cleanupTemporaryUri';

export { cleanupTemporaryUri } from './cleanupTemporaryUri';

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
    cleanupTemporaryUri(saved.uri);
    throw new Error('Could not prepare image bytes for local analysis.');
  }

  return {
    dataUrl: `data:image/jpeg;base64,${saved.base64}`,
    width: saved.width,
    height: saved.height,
    temporaryUri: saved.uri,
  };
}
