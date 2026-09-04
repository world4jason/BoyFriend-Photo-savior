import type { GuideSpec, NormalizedPoint, PersonGuide, PoseJoints } from '../types';
import type { PoseLandmark } from '../pose/PoseDetector';
import { classifyPortraitCrop } from '../analysis/classifyPortraitCrop';
import { lensHintFromGuide } from '../shooting/lensHint';

export type PersonContourDetection = {
  contour: NormalizedPoint[];
  maskWidth: number;
  maskHeight: number;
  foregroundRatio: number;
  /** Optional shared pose geometry from MediaPipe Pose Landmarker. */
  poseLandmarks?: PoseLandmark[];
  /** Optional higher-precision face direction from MediaPipe Face Landmarker. */
  faceDirection?: PersonGuide['head']['facing'];
  /** Approximate horizontal head turn. This is advisory rather than a calibrated camera angle. */
  faceYawDegrees?: number;
};

type TrustedLandmark = (name: string, minConfidence?: number) => PoseLandmark | undefined;

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const midpoint = (a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/**
 * Pose-based face direction is only a fallback for when the dedicated face
 * model has no result. Reuse the same trusted-landmark boundary as the rest of
 * guide geometry so low-quality pose points never become a confident cue.
 */
function inferFacing(visible: TrustedLandmark): PersonGuide['head']['facing'] {
  const nose = visible('nose', 0.10);
  const leftEar = visible('left_ear');
  const rightEar = visible('right_ear');
  const leftEye = visible('left_eye');
  const rightEye = visible('right_eye');
  if (!nose) return 'front';

  const pair = leftEar && rightEar
    ? [leftEar, rightEar]
    : leftEye && rightEye
      ? [leftEye, rightEye]
      : null;

  if (!pair) return 'front';
  const centerX = (pair[0].x + pair[1].x) / 2;
  const span = Math.max(0.02, Math.abs(pair[1].x - pair[0].x));
  const threshold = Math.max(0.008, span * 0.10);
  if (nose.x < centerX - threshold) return 'left';
  if (nose.x > centerX + threshold) return 'right';
  return 'front';
}

export function buildGuideFromContour(
  detection: PersonContourDetection,
  aspectRatio: number,
  sourceUri?: string,
): GuideSpec {
  if (detection.contour.length < 12) {
    throw new Error('The detected person outline is too small to build a guide.');
  }

  const xs = detection.contour.map((point) => point.x);
  const ys = detection.contour.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const bodyWidth = Math.max(0.08, right - left);
  const bodyHeight = Math.max(0.16, bottom - top);
  const centerX = (left + right) / 2;

  const byName = new Map((detection.poseLandmarks ?? []).map((point) => [point.name, point]));
  const visible: TrustedLandmark = (name, minConfidence = 0.18) => {
    const point = byName.get(name);
    if (!point) return undefined;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return undefined;
    if (point.confidence != null) {
      if (!Number.isFinite(point.confidence) || point.confidence < minConfidence) return undefined;
    }
    return point;
  };

  const leftShoulder = visible('left_shoulder');
  const rightShoulder = visible('right_shoulder');
  const leftHip = visible('left_hip');
  const rightHip = visible('right_hip');
  const nose = visible('nose', 0.10);

  const headBandBottom = top + bodyHeight * 0.19;
  const headPoints = detection.contour.filter((point) => point.y <= headBandBottom);
  const headXs = headPoints.length >= 4 ? headPoints.map((point) => point.x) : xs;
  const headLeft = Math.min(...headXs);
  const headRight = Math.max(...headXs);

  const facePoints = [
    visible('nose', 0.08),
    visible('left_eye', 0.08),
    visible('right_eye', 0.08),
    visible('left_ear', 0.08),
    visible('right_ear', 0.08),
    visible('mouth_left', 0.08),
    visible('mouth_right', 0.08),
  ].filter(Boolean) as PoseLandmark[];

  const faceCenterX = facePoints.length >= 2
    ? facePoints.reduce((sum, point) => sum + point.x, 0) / facePoints.length
    : (headLeft + headRight) / 2;

  const shoulderMid = leftShoulder && rightShoulder
    ? midpoint(leftShoulder, rightShoulder)
    : { x: centerX, y: clamp(top + bodyHeight * 0.22) };

  const hipMid = leftHip && rightHip
    ? midpoint(leftHip, rightHip)
    : { x: centerX, y: clamp(top + bodyHeight * 0.57) };

  const poseShoulderWidth = leftShoulder && rightShoulder
    ? Math.abs(rightShoulder.x - leftShoulder.x)
    : 0;
  const shoulderWidth = Math.max(bodyWidth * 0.52, poseShoulderWidth, 0.08);

  const headCenterX = clamp(faceCenterX);
  const headCenterY = clamp(top + bodyHeight * 0.095);
  const headRxFromContour = Math.max(0.035, (headRight - headLeft) * 0.52);
  const faceSpan = facePoints.length >= 2
    ? Math.max(...facePoints.map((point) => point.x)) - Math.min(...facePoints.map((point) => point.x))
    : 0;
  const headRx = clamp(Math.max(headRxFromContour, faceSpan * 0.62, shoulderWidth * 0.19), 0.035, 0.15);
  const headRy = clamp(Math.max(0.045, bodyHeight * 0.09, headRx * 1.22), 0.045, 0.17);

  const joints: PoseJoints = {
    leftElbow: visible('left_elbow'),
    rightElbow: visible('right_elbow'),
    leftWrist: visible('left_wrist'),
    rightWrist: visible('right_wrist'),
    leftHip,
    rightHip,
    leftKnee: visible('left_knee'),
    rightKnee: visible('right_knee'),
    leftAnkle: visible('left_ankle'),
    rightAnkle: visible('right_ankle'),
  };

  const facing = detection.faceDirection ?? inferFacing(visible);

  const person: PersonGuide = {
    contour: detection.contour,
    head: {
      center: nose
        ? { x: headCenterX, y: headCenterY }
        : { x: clamp((headLeft + headRight) / 2), y: headCenterY },
      rx: headRx,
      ry: headRy,
      facing,
    },
    shoulders: {
      left: leftShoulder ?? { x: clamp(centerX - bodyWidth * 0.34), y: shoulderMid.y },
      right: rightShoulder ?? { x: clamp(centerX + bodyWidth * 0.34), y: shoulderMid.y },
    },
    torso: {
      top: shoulderMid,
      bottom: hipMid,
      width: shoulderWidth,
    },
    joints,
  };

  const crop = classifyPortraitCrop({
    hasAnkle: Boolean(joints.leftAnkle || joints.rightAnkle),
    hasKnee: Boolean(joints.leftKnee || joints.rightKnee),
    hasHip: Boolean(joints.leftHip || joints.rightHip),
    hasArm: Boolean(joints.leftElbow || joints.rightElbow || joints.leftWrist || joints.rightWrist),
    hasUpperPose: Boolean(nose || leftShoulder || rightShoulder),
    silhouetteBottom: bottom,
  });

  const guide: GuideSpec = {
    kind: 'portrait',
    mode: 'outline',
    displayMode: 'outline',
    // Keep legacy compatibility until all existing template/sample data migrate.
    visualStyle: 'sovs',
    people: [person],
    crop,
    lookSpace: facing === 'left' ? 'left' : facing === 'right' ? 'right' : 'center',
    sourceUri,
    fidelity: 'source-derived',
    aspectRatio: aspectRatio > 0 ? aspectRatio : 0.75,
    transform: { dx: 0, dy: 0, scale: 1 },
  };
  guide.lensHint = lensHintFromGuide(guide);
  return guide;
}
