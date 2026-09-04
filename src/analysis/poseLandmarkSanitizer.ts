import type { PoseLandmark } from '../pose/PoseDetector';

export const POSE_NAMES = [
  'nose',
  'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear',
  'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_pinky', 'right_pinky',
  'left_index', 'right_index',
  'left_thumb', 'right_thumb',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
  'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index',
] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function finiteNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Convert MediaPipe's pose result into shared geometry without laundering
 * non-finite model output into valid-looking 0/1 boundary coordinates.
 *
 * Coordinates are clamped only after they pass the finite-value gate. A
 * present visibility/presence value is also required to be finite; if neither
 * confidence signal exists, confidence remains undefined for backwards-
 * compatible downstream handling.
 */
export function poseResultToLandmarks(result: any): PoseLandmark[] {
  const pose = result?.landmarks?.[0];
  if (!Array.isArray(pose)) return [];

  return pose.flatMap((point: any, index: number): PoseLandmark[] => {
    const x = finiteNumber(point?.x);
    const y = finiteNumber(point?.y);
    if (x == null || y == null) return [];

    let confidence: number | undefined;
    if (point?.visibility != null) {
      const visibility = finiteNumber(point.visibility);
      if (visibility == null) return [];
      confidence = visibility;
    } else if (point?.presence != null) {
      const presence = finiteNumber(point.presence);
      if (presence == null) return [];
      confidence = presence;
    }

    return [{
      name: POSE_NAMES[index] ?? `landmark_${index}`,
      x: clamp01(x),
      y: clamp01(y),
      confidence,
    }];
  });
}
