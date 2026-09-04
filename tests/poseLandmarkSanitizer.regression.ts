import { poseResultToLandmarks } from '../src/analysis/poseLandmarkSanitizer';

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

const result = (points: any[]) => ({ landmarks: [points] });

test('non-finite raw coordinates are dropped before clamping', () => {
  const landmarks = poseResultToLandmarks(result([
    { x: Number.POSITIVE_INFINITY, y: 0.2, visibility: 0.9 },
    { x: 0.4, y: Number.NaN, visibility: 0.9 },
    { x: 0.5, y: 0.3, visibility: 0.9 },
  ]));

  equal(landmarks.length, 1, 'only finite raw point should survive');
  equal(landmarks[0].name, 'left_eye', 'surviving index keeps MediaPipe semantic name');
  equal(landmarks[0].x, 0.5, 'finite coordinate is preserved');
});

test('present non-finite visibility rejects the landmark instead of falling through to presence', () => {
  const landmarks = poseResultToLandmarks(result([
    { x: 0.5, y: 0.3, visibility: Number.POSITIVE_INFINITY, presence: 0.95 },
  ]));

  equal(landmarks.length, 0, 'invalid present visibility must reject the point');
});

test('finite presence is used when visibility is absent', () => {
  const landmarks = poseResultToLandmarks(result([
    { x: 0.5, y: 0.3, presence: 0.72 },
  ]));

  equal(landmarks.length, 1, 'finite point with presence should survive');
  equal(landmarks[0].confidence, 0.72, 'presence becomes confidence fallback');
});

test('missing confidence remains undefined and finite coordinates are clamped only after validation', () => {
  const landmarks = poseResultToLandmarks(result([
    { x: 1.2, y: -0.2 },
  ]));

  equal(landmarks.length, 1, 'finite coordinate without confidence remains eligible');
  equal(landmarks[0].x, 1, 'finite out-of-frame x clamps to one');
  equal(landmarks[0].y, 0, 'finite out-of-frame y clamps to zero');
  equal(landmarks[0].confidence, undefined, 'missing confidence stays missing');
  assert(Number.isFinite(landmarks[0].x) && Number.isFinite(landmarks[0].y), 'shared coordinates remain finite');
});

console.log('Pose Landmark Sanitizer regression suite passed.');
