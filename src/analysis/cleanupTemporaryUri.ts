/**
 * Web/default implementation.
 * Browser-side ImageManipulator results are managed by the browser runtime;
 * expo-file-system is native-only, so cleanup is intentionally a no-op here.
 */
export function cleanupTemporaryUri(_uri?: string | null) {
  // no-op
}
