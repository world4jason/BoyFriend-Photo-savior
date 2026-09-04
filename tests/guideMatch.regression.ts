import { scorePortraitMatch } from '../src/matching/guideMatch';
import type { GuideSpec, NormalizedPoint, PersonGuide, PoseJoints } from '../src/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function near(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}±${tolerance}, got ${actual}`);
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

function mapJoints(joints: PoseJoints | undefined, map: (point: NormalizedPoint) => NormalizedPoint): PoseJoints | undefined {
  if (!joints) return undefined;
  const result: PoseJoints = {};
  for (const [name, point] of Object.entries(joints) as [keyof PoseJoints, NormalizedPoint | undefined][]) {
    if (point) result[name] = map(point);
  }
  return result;
}

function mapPerson(person: PersonGuide, map: (point: NormalizedPoint) => NormalizedPoint): PersonGuide {
  return {
    contour: person.contour?.map(map),
    head: {
      ...person.head,
      center: map(person.head.center),
    },
    shoulders: {
      left: map(person.shoulders.left),
      right: map(person.shoulders.right),
    },
    torso: {
      ...person.torso,
      top: map(person.torso.top),
      bottom: map(person.torso.bottom),
    },
    joints: mapJoints(person.joints, map),
  };
}

function basePerson(overrides: Partial<PersonGuide> = {}): PersonGuide {
  return {
    contour: [
      { x: 0.32, y: 0.18 },
      { x: 0.68, y: 0.18 },
      { x: 0.68, y: 0.82 },
      { x: 0.32, y: 0.82 },
    ],
    head: {
      center: { x: 0.50, y: 0.28 },
      rx: 0.07,
      ry: 0.09,
      facing: 'front',
    },
    shoulders: {
      left: { x: 0.39, y: 0.40 },
      right: { x: 0.61, y: 0.40 },
    },
    torso: {
      top: { x: 0.50, y: 0.40 },
      bottom: { x: 0.50, y: 0.68 },
      width: 0.22,
    },
    ...overrides,
  };
}

function guide(person: PersonGuide, aspectRatio = 0.75): GuideSpec {
  return {
    kind: 'portrait',
    mode: 'outline',
    displayMode: 'outline',
    people: [person],
    crop: 'full',
    lookSpace: 'center',
    aspectRatio,
    transform: { dx: 0, dy: 0, scale: 1 },
  };
}

/**
 * Independent fixture for a 3:4 source shown in a 9:16 camera.
 *
 * 9/16 ÷ 3/4 = 0.75, so the 3:4 source occupies 75% of the camera height,
 * leaving 12.5% above and below. This intentionally uses fixed expected
 * geometry rather than duplicating guideMatch's generic aspect-fit branches.
 */
function expectedThreeByFourInNineBySixteen(point: NormalizedPoint): NormalizedPoint {
  return {
    x: point.x,
    y: 0.125 + point.y * 0.75,
  };
}

test('aspect-fitted 3:4 target visually aligned in 9:16 camera scores as matched', () => {
  const targetPerson = basePerson();
  const livePerson = mapPerson(targetPerson, expectedThreeByFourInNineBySixteen);

  const result = scorePortraitMatch(
    guide(targetPerson, 3 / 4),
    guide(livePerson, 9 / 16),
  );

  equal(result.status, 'matched', 'visually aligned cross-aspect subject should match');
  near(result.framingScore, 100, 1, 'cross-aspect framing score');
  near(result.scaleScore, 100, 1, 'cross-aspect scale score');
  equal(result.hint, '✓ Match', 'aligned cross-aspect hint');
});

test('subject displaced right receives a move-left instruction', () => {
  const targetPerson = basePerson();
  const livePerson = mapPerson(targetPerson, (point) => ({ x: point.x + 0.10, y: point.y }));
  const result = scorePortraitMatch(guide(targetPerson), guide(livePerson));

  equal(result.hint, 'Subject → left', 'horizontal correction direction');
  assert(result.status !== 'matched', 'displaced subject must not match');
  assert(result.framingScore < 76, 'meaningful displacement should fail framing component gate');
});

test('pose-intent target cannot fall back to framing-only when live joints disappear', () => {
  const targetPerson = basePerson({
    joints: {
      leftElbow: { x: 0.34, y: 0.51 },
      rightElbow: { x: 0.66, y: 0.51 },
    },
  });
  const livePerson = basePerson({ joints: undefined });
  const result = scorePortraitMatch(guide(targetPerson), guide(livePerson));

  equal(result.poseScore, undefined, 'missing live pose should have no pose score');
  equal(result.hint, 'Show the full pose', 'missing required pose should request visibility');
  assert(result.status !== 'matched', 'missing required pose signal must block matched state');
});

test('meaningful target face direction blocks matched state until face direction agrees', () => {
  const targetPerson = basePerson({
    head: {
      center: { x: 0.50, y: 0.28 },
      rx: 0.07,
      ry: 0.09,
      facing: 'right',
    },
  });
  const livePerson = basePerson();
  const result = scorePortraitMatch(guide(targetPerson), guide(livePerson));

  equal(result.faceScore, 55, 'front-facing live face gets partial face score against turned target');
  equal(result.hint, 'Face → right', 'face correction direction');
  assert(result.status !== 'matched', 'wrong face direction must block matched state');
});

test('duo/group portrait target remains manual-guide-only', () => {
  const first = basePerson();
  const second = mapPerson(first, (point) => ({ x: point.x + 0.18, y: point.y }));
  const target: GuideSpec = {
    ...guide(first),
    people: [first, second],
  };
  const result = scorePortraitMatch(target, guide(first));

  equal(result.status, 'searching', 'multi-person target cannot produce live matched state');
  equal(result.hint, 'Manual guide only', 'multi-person target communicates manual-only behavior');
  equal(result.score, 0, 'manual-only target does not expose misleading match score');
});

test('subject too small is told to move closer before pose refinements', () => {
  const targetPerson = basePerson();
  const shrinkAroundCenter = (point: NormalizedPoint): NormalizedPoint => ({
    x: 0.5 + (point.x - 0.5) * 0.72,
    y: 0.5 + (point.y - 0.5) * 0.72,
  });
  const livePerson = mapPerson(targetPerson, shrinkAroundCenter);
  const result = scorePortraitMatch(guide(targetPerson), guide(livePerson));

  equal(result.hint, 'Move closer', 'scale correction should tell photographer to move closer');
  assert(result.status !== 'matched', 'undersized subject must not match');
});

console.log('Guide Match regression suite passed.');
