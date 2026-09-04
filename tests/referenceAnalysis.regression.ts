import { buildGuideFromContour, type PersonContourDetection } from '../src/segmentation/guideFromContour';
import type { PoseLandmark } from '../src/pose/PoseDetector';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
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

const CONTOUR = [
  { x: 0.44, y: 0.08 },
  { x: 0.56, y: 0.08 },
  { x: 0.63, y: 0.13 },
  { x: 0.69, y: 0.24 },
  { x: 0.72, y: 0.43 },
  { x: 0.68, y: 0.76 },
  { x: 0.60, y: 0.94 },
  { x: 0.40, y: 0.94 },
  { x: 0.32, y: 0.76 },
  { x: 0.28, y: 0.43 },
  { x: 0.31, y: 0.24 },
  { x: 0.37, y: 0.13 },
];

function landmark(name: string, x: number, y: number, confidence = 0.95): PoseLandmark {
  return { name, x, y, confidence };
}

function detection(
  poseLandmarks: PoseLandmark[],
  faceDirection?: 'left' | 'right' | 'front',
): PersonContourDetection {
  return {
    contour: CONTOUR,
    maskWidth: 256,
    maskHeight: 384,
    foregroundRatio: 0.28,
    poseLandmarks,
    faceDirection,
  };
}

function fallbackFace(direction: 'left' | 'right' | 'front', confidence = 0.95): PoseLandmark[] {
  if (direction === 'right') {
    return [
      landmark('nose', 0.57, 0.18, confidence),
      landmark('left_eye', 0.45, 0.17, confidence),
      landmark('right_eye', 0.55, 0.17, confidence),
    ];
  }
  if (direction === 'left') {
    return [
      landmark('nose', 0.43, 0.18, confidence),
      landmark('left_eye', 0.45, 0.17, confidence),
      landmark('right_eye', 0.55, 0.17, confidence),
    ];
  }
  return [
    landmark('nose', 0.50, 0.18, confidence),
    landmark('left_eye', 0.45, 0.17, confidence),
    landmark('right_eye', 0.55, 0.17, confidence),
  ];
}

test('dedicated face direction overrides conflicting low-confidence pose fallback', () => {
  const guide = buildGuideFromContour(
    detection(fallbackFace('left', 0.02), 'right'),
    3 / 4,
  );

  equal(guide.people[0].head.facing, 'right', 'dedicated Face Landmarker direction must win');
  equal(guide.lookSpace, 'right', 'look-space follows trusted dedicated face direction');
});

test('low-confidence pose face landmarks do not invent a left/right fallback cue', () => {
  const guide = buildGuideFromContour(
    detection(fallbackFace('right', 0.05)),
    3 / 4,
  );

  equal(guide.people[0].head.facing, 'front', 'low-confidence fallback must remain neutral');
  equal(guide.lookSpace, 'center', 'neutral fallback must not create directional look-space');
});

test('trusted pose face landmarks can infer fallback direction when face model is unavailable', () => {
  const guide = buildGuideFromContour(
    detection(fallbackFace('right', 0.95)),
    3 / 4,
  );

  equal(guide.people[0].head.facing, 'right', 'trusted fallback should infer right-facing direction');
  equal(guide.lookSpace, 'right', 'trusted fallback direction propagates to look-space');
});

test('non-finite shoulder coordinate is excluded and contour fallback remains finite', () => {
  const pose = [
    landmark('left_shoulder', Number.NaN, 0.34, 0.99),
    landmark('right_shoulder', 0.62, 0.34, 0.99),
    ...fallbackFace('front', 0.95),
  ];
  const guide = buildGuideFromContour(detection(pose), 3 / 4);
  const person = guide.people[0];

  assert(Number.isFinite(person.shoulders.left.x), 'fallback left-shoulder x must stay finite');
  assert(Number.isFinite(person.shoulders.left.y), 'fallback left-shoulder y must stay finite');
  assert(Number.isFinite(person.torso.top.x), 'torso top x must stay finite');
  assert(Number.isFinite(person.torso.width), 'torso width must stay finite');
});

test('non-finite confidence rejects an otherwise finite pose landmark', () => {
  const pose = [
    landmark('left_shoulder', 0.05, 0.34, Number.NaN),
    landmark('right_shoulder', 0.62, 0.34, 0.99),
    ...fallbackFace('front', 0.95),
  ];
  const guide = buildGuideFromContour(detection(pose), 3 / 4);
  const leftShoulder = guide.people[0].shoulders.left;

  assert(leftShoulder.x > 0.20, 'NaN-confidence landmark must be ignored instead of using x=0.05');
  assert(Number.isFinite(leftShoulder.x), 'fallback shoulder x must remain finite');
});

console.log('Reference Analysis regression suite passed.');
