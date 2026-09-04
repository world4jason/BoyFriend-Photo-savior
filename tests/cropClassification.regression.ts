import { classifyPortraitCrop, type PortraitCropEvidence } from '../src/analysis/classifyPortraitCrop';
import { buildGuideFromContour, type PersonContourDetection } from '../src/segmentation/guideFromContour';
import type { PoseLandmark } from '../src/pose/PoseDetector';

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function test(name: string, run: () => void) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const evidence = (overrides: Partial<PortraitCropEvidence> = {}): PortraitCropEvidence => ({
  hasAnkle: false,
  hasKnee: false,
  hasHip: false,
  hasArm: false,
  hasUpperPose: false,
  silhouetteBottom: 0.96,
  ...overrides,
});

test('trusted ankle wins over all silhouette heuristics', () => {
  equal(classifyPortraitCrop(evidence({ hasAnkle: true, silhouetteBottom: 0.60 })), 'full', 'ankle crop');
});

test('trusted knee without ankle produces three-quarter crop', () => {
  equal(classifyPortraitCrop(evidence({ hasKnee: true })), 'three-quarter', 'knee crop');
});

test('trusted hip touching frame bottom stays half rather than full', () => {
  equal(classifyPortraitCrop(evidence({ hasHip: true })), 'half', 'hip crop');
});

test('trusted arm without lower-body evidence is conservative half crop', () => {
  equal(classifyPortraitCrop(evidence({ hasArm: true })), 'half', 'arm crop');
});

test('trusted face/shoulder-only pose stays headshot even when silhouette touches bottom', () => {
  equal(classifyPortraitCrop(evidence({ hasUpperPose: true })), 'headshot', 'upper-pose crop');
});

test('segmentation-bottom heuristic remains as fail-soft when pose evidence is unavailable', () => {
  equal(classifyPortraitCrop(evidence({ silhouetteBottom: 0.96 })), 'full', 'segmentation full fallback');
  equal(classifyPortraitCrop(evidence({ silhouetteBottom: 0.84 })), 'three-quarter', 'segmentation three-quarter fallback');
  equal(classifyPortraitCrop(evidence({ silhouetteBottom: 0.70 })), 'half', 'segmentation half fallback');
  equal(classifyPortraitCrop(evidence({ silhouetteBottom: 0.50 })), 'headshot', 'segmentation headshot fallback');
});

const CONTOUR_BOTTOM_096 = [
  { x: 0.44, y: 0.08 }, { x: 0.56, y: 0.08 },
  { x: 0.64, y: 0.14 }, { x: 0.70, y: 0.26 },
  { x: 0.72, y: 0.46 }, { x: 0.68, y: 0.78 },
  { x: 0.60, y: 0.96 }, { x: 0.40, y: 0.96 },
  { x: 0.32, y: 0.78 }, { x: 0.28, y: 0.46 },
  { x: 0.30, y: 0.26 }, { x: 0.36, y: 0.14 },
];

const landmark = (name: string, x: number, y: number, confidence = 0.95): PoseLandmark => ({
  name,
  x,
  y,
  confidence,
});

function detection(poseLandmarks: PoseLandmark[]): PersonContourDetection {
  return {
    contour: CONTOUR_BOTTOM_096,
    maskWidth: 256,
    maskHeight: 384,
    foregroundRatio: 0.30,
    poseLandmarks,
  };
}

test('guide integration: trusted hip overrides bottom=0.96 and yields 2x lens hint', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.50, 0.16),
    landmark('left_shoulder', 0.40, 0.32),
    landmark('right_shoulder', 0.60, 0.32),
    landmark('left_hip', 0.44, 0.72),
    landmark('right_hip', 0.56, 0.72),
  ]), 3 / 4);

  equal(guide.crop, 'half', 'trusted hip integration crop');
  equal(guide.lensHint?.zoom, 2, 'half-body lens hint');
});

test('guide integration: shoulders-only portrait at bottom=0.96 is headshot with 3x hint', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.50, 0.16),
    landmark('left_shoulder', 0.40, 0.32),
    landmark('right_shoulder', 0.60, 0.32),
  ]), 3 / 4);

  equal(guide.crop, 'headshot', 'shoulder-only integration crop');
  equal(guide.lensHint?.zoom, 3, 'headshot lens hint');
});

test('guide integration: no trusted pose keeps segmentation-only full-body fallback', () => {
  const guide = buildGuideFromContour(detection([]), 3 / 4);
  equal(guide.crop, 'full', 'no-pose segmentation fallback crop');
  equal(guide.lensHint?.zoom, 1, 'segmentation full fallback lens hint');
});

console.log('Crop Classification regression suite passed.');
