import { File } from 'expo-file-system';

/** Native cache cleanup for iOS / Android. */
export function cleanupTemporaryUri(uri?: string | null) {
  if (!uri || !uri.startsWith('file://')) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best-effort only: cleanup must never interrupt camera or analysis UX.
  }
}
