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
  shoulderY: undefined,
  silhouetteTop: 0.08,
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

test('shoulders high in the silhouette imply a longer upper-body crop, not headshot', () => {
  equal(classifyPortraitCrop(evidence({ shoulderY: 0.32 })), 'half', 'high-shoulder crop');
});

test('shoulders near the silhouette bottom imply a tight head-and-shoulders crop', () => {
  equal(classifyPortraitCrop(evidence({ shoulderY: 0.72 })), 'headshot', 'close-up shoulder crop');
});

test('exact 38% below-shoulder boundary remains headshot while just over becomes half', () => {
  const silhouetteHeight = 0.96 - 0.08;
  const boundaryShoulderY = 0.96 - silhouetteHeight * 0.38;
  equal(classifyPortraitCrop(evidence({ shoulderY: boundaryShoulderY })), 'headshot', 'exact threshold crop');
  equal(classifyPortraitCrop(evidence({ shoulderY: boundaryShoulderY - 0.001 })), 'half', 'just-over threshold crop');
});

test('shoulder outside segmented vertical bounds is ignored for crop classification', () => {
  equal(classifyPortraitCrop(evidence({ shoulderY: 1.05 })), 'full', 'below-silhouette shoulder falls back');
  equal(classifyPortraitCrop(evidence({ shoulderY: -0.05 })), 'full', 'above-silhouette shoulder falls back');
});

test('segmentation-bottom heuristic remains fail-soft when trusted shoulders/lower anatomy are unavailable', () => {
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

test('guide integration: shoulders high in frame keep bottom-touching upper body at half / 2x', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.50, 0.16),
    landmark('left_shoulder', 0.40, 0.32),
    landmark('right_shoulder', 0.60, 0.32),
  ]), 3 / 4);

  equal(guide.crop, 'half', 'longer shoulder-to-bottom span integration crop');
  equal(guide.lensHint?.zoom, 2, 'longer upper-body lens hint');
});

test('guide integration: shoulders near bottom create headshot / 3x hint', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.50, 0.56),
    landmark('left_shoulder', 0.40, 0.72),
    landmark('right_shoulder', 0.60, 0.72),
  ]), 3 / 4);

  equal(guide.crop, 'headshot', 'tight shoulder-to-bottom span integration crop');
  equal(guide.lensHint?.zoom, 3, 'headshot lens hint');
});

test('guide integration: nose-only pose does not force headshot classification', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.50, 0.16),
  ]), 3 / 4);

  equal(guide.crop, 'full', 'nose-only pose falls back to segmentation crop heuristic');
  equal(guide.lensHint?.zoom, 1, 'nose-only fallback keeps segmentation-derived lens hint');
});

test('guide integration: isolated elbow/wrist does not force half-body classification', () => {
  const guide = buildGuideFromContour(detection([
    landmark('left_elbow', 0.42, 0.44),
    landmark('left_wrist', 0.48, 0.28),
  ]), 3 / 4);

  equal(guide.crop, 'full', 'isolated arm evidence falls back to segmentation crop heuristic');
  equal(guide.lensHint?.zoom, 1, 'isolated arm fallback keeps segmentation-derived lens hint');
});

test('guide integration: no trusted pose keeps segmentation-only full-body fallback', () => {
  const guide = buildGuideFromContour(detection([]), 3 / 4);
  equal(guide.crop, 'full', 'no-pose segmentation fallback crop');
  equal(guide.lensHint?.zoom, 1, 'segmentation full fallback lens hint');
});

console.log('Crop Classification regression suite passed.');
