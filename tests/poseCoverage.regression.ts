import { scorePortraitMatch } from '../src/matching/guideMatch';
import type { GuideSpec, PersonGuide, PoseJoints } from '../src/types';

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

const FULL_BODY_JOINTS: PoseJoints = {
  leftElbow: { x: 0.34, y: 0.48 },
  rightElbow: { x: 0.66, y: 0.48 },
  leftWrist: { x: 0.31, y: 0.60 },
  rightWrist: { x: 0.69, y: 0.60 },
  leftHip: { x: 0.43, y: 0.64 },
  rightHip: { x: 0.57, y: 0.64 },
  leftKnee: { x: 0.43, y: 0.76 },
  rightKnee: { x: 0.57, y: 0.76 },
};

function person(joints?: PoseJoints): PersonGuide {
  return {
    contour: [
      { x: 0.30, y: 0.16 },
      { x: 0.70, y: 0.16 },
      { x: 0.70, y: 0.88 },
      { x: 0.30, y: 0.88 },
    ],
    head: {
      center: { x: 0.50, y: 0.26 },
      rx: 0.07,
      ry: 0.09,
      facing: 'front',
    },
    shoulders: {
      left: { x: 0.40, y: 0.38 },
      right: { x: 0.60, y: 0.38 },
    },
    torso: {
      top: { x: 0.50, y: 0.38 },
      bottom: { x: 0.50, y: 0.66 },
      width: 0.20,
    },
    joints,
  };
}

function guide(subject: PersonGuide): GuideSpec {
  return {
    kind: 'portrait',
    mode: 'outline',
    displayMode: 'outline',
    people: [subject],
    crop: 'full',
    lookSpace: 'center',
    aspectRatio: 0.75,
    transform: { dx: 0, dy: 0, scale: 1 },
  };
}

function pickJoints(keys: (keyof PoseJoints)[]): PoseJoints {
  const result: PoseJoints = {};
  for (const key of keys) {
    const point = FULL_BODY_JOINTS[key];
    if (point) result[key] = point;
  }
  return result;
}

test('8-anchor full-body target rejects live pose with only 2 covered optional anchors', () => {
  const target = guide(person(FULL_BODY_JOINTS));
  const live = guide(person(pickJoints(['leftElbow', 'rightElbow'])));
  const result = scorePortraitMatch(target, live);

  equal(result.poseScore, undefined, '2/8 optional anchors is below majority coverage');
  equal(result.hint, 'Show the full pose', 'insufficient coverage should request more pose visibility');
  assert(result.status !== 'matched', 'partial upper-body pose must not validate full-body target');
});

test('8-anchor full-body target accepts 5 matching optional anchors for pose scoring', () => {
  const target = guide(person(FULL_BODY_JOINTS));
  const live = guide(person(pickJoints([
    'leftElbow',
    'rightElbow',
    'leftWrist',
    'rightWrist',
    'leftHip',
  ])));
  const result = scorePortraitMatch(target, live);

  equal(result.poseScore, 100, '5/8 optional anchors meets the 60% majority gate');
  equal(result.status, 'matched', 'sufficient matching coverage can validate the pose');
  equal(result.hint, '✓ Match', 'sufficient coverage should follow normal matched guidance');
});

test('2-anchor target requires both optional anchors rather than one plus shoulders', () => {
  const targetJoints = pickJoints(['leftElbow', 'rightElbow']);
  const target = guide(person(targetJoints));
  const live = guide(person(pickJoints(['leftElbow'])));
  const result = scorePortraitMatch(target, live);

  equal(result.poseScore, undefined, '1/2 optional anchors is insufficient for a two-anchor pose');
  equal(result.hint, 'Show the full pose', 'small pose still requires complete two-anchor intent');
  assert(result.status !== 'matched', 'one optional joint plus shoulders must not validate two-anchor pose');
});

console.log('Pose Coverage regression suite passed.');
