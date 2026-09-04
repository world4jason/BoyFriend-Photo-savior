import { buildGuideFromContour, type PersonContourDetection } from '../src/segmentation/guideFromContour';
import type { PoseLandmark } from '../src/pose/PoseDetector';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

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

const CONTOUR = [
  { x: 0.44, y: 0.08 }, { x: 0.56, y: 0.08 },
  { x: 0.63, y: 0.13 }, { x: 0.69, y: 0.24 },
  { x: 0.72, y: 0.43 }, { x: 0.68, y: 0.76 },
  { x: 0.60, y: 0.94 }, { x: 0.40, y: 0.94 },
  { x: 0.32, y: 0.76 }, { x: 0.28, y: 0.43 },
  { x: 0.31, y: 0.24 }, { x: 0.37, y: 0.13 },
];

const landmark = (name: string, x: number, y: number, confidence?: number): PoseLandmark => ({
  name,
  x,
  y,
  ...(confidence === undefined ? {} : { confidence }),
});

function detection(poseLandmarks: PoseLandmark[]): PersonContourDetection {
  return {
    contour: CONTOUR,
    maskWidth: 256,
    maskHeight: 384,
    foregroundRatio: 0.28,
    poseLandmarks,
  };
}

test('Infinity pose coordinate is rejected from shared geometry', () => {
  const guide = buildGuideFromContour(detection([
    landmark('left_shoulder', Number.POSITIVE_INFINITY, 0.34, 0.99),
    landmark('right_shoulder', 0.62, 0.34, 0.99),
  ]), 3 / 4);

  const leftShoulder = guide.people[0].shoulders.left;
  assert(Number.isFinite(leftShoulder.x), 'Infinity coordinate must not propagate to output geometry');
  assert(leftShoulder.x < 0.50, 'left shoulder should come from contour fallback');
});

test('Infinity confidence rejects an otherwise finite pose landmark', () => {
  const guide = buildGuideFromContour(detection([
    landmark('left_shoulder', 0.05, 0.34, Number.POSITIVE_INFINITY),
    landmark('right_shoulder', 0.62, 0.34, 0.99),
  ]), 3 / 4);

  assert(guide.people[0].shoulders.left.x > 0.20, 'Infinity-confidence x=0.05 must be ignored');
});

test('missing confidence remains eligible when coordinates are finite', () => {
  const guide = buildGuideFromContour(detection([
    landmark('nose', 0.57, 0.18),
    landmark('left_eye', 0.45, 0.17),
    landmark('right_eye', 0.55, 0.17),
  ]), 3 / 4);

  equal(guide.people[0].head.facing, 'right', 'finite fallback landmarks without confidence remain eligible');
});

console.log('Reference Analysis trust-edge regression suite passed.');
