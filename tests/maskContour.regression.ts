import { buildGuideFromContour } from '../src/segmentation/guideFromContour';
import { extractPersonContourFromMask } from '../src/segmentation/maskContour';
import type { NormalizedPoint } from '../src/types';

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
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

function makeMask(width: number, height: number, fill: (x: number, y: number) => boolean) {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (fill(x, y)) mask[y * width + x] = 1;
    }
  }
  return mask;
}

function pointInPolygon(point: NormalizedPoint, polygon: NormalizedPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function silhouetteError(mask: Uint8Array, width: number, height: number) {
  try {
    extractPersonContourFromMask(mask, width, height);
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function assertNormalizedRing(ring: NormalizedPoint[], minPoints: number, maxPoints: number, label: string) {
  ok(ring.length >= minPoints, `${label}: expected at least ${minPoints} points, got ${ring.length}`);
  ok(ring.length <= maxPoints, `${label}: expected at most ${maxPoints} points, got ${ring.length}`);
  ring.forEach((point, index) => {
    ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${label} point ${index} must be finite`);
    ok(point.x >= 0 && point.x <= 1, `${label} point ${index}.x must stay normalized`);
    ok(point.y >= 0 && point.y <= 1, `${label} point ${index}.y must stay normalized`);
  });
}

function assertBoundedNormalizedContour(contour: NormalizedPoint[]) {
  assertNormalizedRing(contour, 24, 128, 'outer contour');
}

test('boundary tracing preserves an exterior arm/torso concavity', () => {
  const width = 30;
  const height = 30;
  const mask = makeMask(width, height, (x, y) => {
    const torso = x >= 12 && x <= 19 && y >= 4 && y <= 25;
    const arm = x >= 5 && x <= 7 && y >= 5 && y <= 18;
    const shoulderBridge = x >= 8 && x <= 11 && y >= 5 && y <= 7;
    return torso || arm || shoulderBridge;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.strategy, 'boundary', 'contour extraction strategy');
  assertBoundedNormalizedContour(result.contour);
  equal(result.contourHoles.length, 0, 'open arm gap is exterior, not an enclosed hole');

  ok(pointInPolygon({ x: 6.2 / width, y: 12.2 / height }, result.contour), 'arm point should stay inside');
  ok(pointInPolygon({ x: 15.2 / width, y: 12.2 / height }, result.contour), 'torso point should stay inside');
  ok(!pointInPolygon({ x: 10.2 / width, y: 12.2 / height }, result.contour), 'exterior gap must not be filled by a scanline hull');
});

test('boundary tracing preserves exterior negative space between separated legs', () => {
  const width = 30;
  const height = 34;
  const mask = makeMask(width, height, (x, y) => {
    const torso = x >= 9 && x <= 20 && y >= 3 && y <= 16;
    const leftLeg = x >= 9 && x <= 12 && y >= 17 && y <= 31;
    const rightLeg = x >= 17 && x <= 20 && y >= 17 && y <= 31;
    return torso || leftLeg || rightLeg;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.strategy, 'boundary', 'separated-leg strategy');
  assertBoundedNormalizedContour(result.contour);

  ok(pointInPolygon({ x: 10.5 / width, y: 24.5 / height }, result.contour), 'left leg should stay inside');
  ok(pointInPolygon({ x: 18.5 / width, y: 24.5 / height }, result.contour), 'right leg should stay inside');
  ok(!pointInPolygon({ x: 15 / width, y: 24.5 / height }, result.contour), 'open leg gap must remain exterior background');
});

test('largest connected component ignores a small disconnected foreground island', () => {
  const width = 32;
  const height = 32;
  const mask = makeMask(width, height, (x, y) => {
    const person = x >= 10 && x <= 21 && y >= 5 && y <= 27;
    const noise = x >= 1 && x <= 2 && y >= 1 && y <= 2;
    return person || noise;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.strategy, 'boundary', 'largest-component strategy');
  assertBoundedNormalizedContour(result.contour);

  const minX = Math.min(...result.contour.map((point) => point.x));
  const minY = Math.min(...result.contour.map((point) => point.y));
  ok(minX > 0.25, `noise island must not pull contour left; minX=${minX}`);
  ok(minY > 0.10, `noise island must not pull contour upward; minY=${minY}`);
});

test('small valid subject remains eligible as mask resolution increases', () => {
  const width = 512;
  const height = 512;
  const mask = makeMask(width, height, (x, y) => x >= 252 && x <= 255 && y >= 220 && y <= 251);

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.strategy, 'boundary', 'small-subject strategy');
  assertBoundedNormalizedContour(result.contour);
});

test('skinny segmentation sliver does not become a valid person component', () => {
  const width = 512;
  const height = 512;
  const mask = makeMask(width, height, (x, y) => x === 255 && y >= 180 && y <= 300);
  const message = silhouetteError(mask, width, height);
  ok(message.includes('No clear person silhouette'), `unexpected skinny-sliver result: ${message || 'accepted'}`);
});

test('meaningful enclosed negative space is retained as an interior contour ring', () => {
  const width = 32;
  const height = 32;
  const mask = makeMask(width, height, (x, y) => {
    const outer = x >= 5 && x <= 26 && y >= 4 && y <= 27;
    const hole = x >= 12 && x <= 18 && y >= 10 && y <= 20;
    return outer && !hole;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.strategy, 'boundary', 'hole-containing component strategy');
  assertBoundedNormalizedContour(result.contour);
  equal(result.contourHoles.length, 1, 'meaningful enclosed hole count');
  assertNormalizedRing(result.contourHoles[0], 12, 64, 'interior ring');

  const center = { x: 15 / width, y: 15 / height };
  ok(pointInPolygon(center, result.contour), 'hole center still lies geometrically inside the outer contour');
  ok(pointInPolygon(center, result.contourHoles[0]), 'interior ring must surround the enclosed background region');

  const guide = buildGuideFromContour({
    contour: result.contour,
    contourHoles: result.contourHoles,
    maskWidth: width,
    maskHeight: height,
    foregroundRatio: result.foregroundRatio,
  }, 1);
  equal(guide.people[0].contourHoles?.length, 1, 'GuideSpec must preserve source-derived interior rings');
});

test('tiny segmentation pinhole is ignored rather than rendered as silhouette noise', () => {
  const width = 32;
  const height = 32;
  const mask = makeMask(width, height, (x, y) => {
    const outer = x >= 5 && x <= 26 && y >= 4 && y <= 27;
    const pinhole = x === 15 && y === 15;
    return outer && !pinhole;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.contourHoles.length, 0, 'one-pixel pinhole should be rejected');
});

test('interior contour-ring count is bounded to the four largest meaningful holes', () => {
  const width = 64;
  const height = 64;
  const holes = [
    [10, 13, 12, 15],
    [20, 23, 12, 15],
    [30, 33, 12, 15],
    [40, 43, 12, 15],
    [50, 53, 12, 15],
  ];
  const mask = makeMask(width, height, (x, y) => {
    const outer = x >= 4 && x <= 59 && y >= 4 && y <= 59;
    const inHole = holes.some(([left, right, top, bottom]) => x >= left && x <= right && y >= top && y <= bottom);
    return outer && !inHole;
  });

  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.contourHoles.length, 4, 'interior ring budget');
  result.contourHoles.forEach((ring, index) => assertNormalizedRing(ring, 12, 64, `interior ring ${index}`));
});

test('ordinary solid silhouette keeps an empty interior-ring list', () => {
  const width = 32;
  const height = 32;
  const mask = makeMask(width, height, (x, y) => x >= 9 && x <= 22 && y >= 4 && y <= 28);
  const result = extractPersonContourFromMask(mask, width, height);
  equal(result.contourHoles.length, 0, 'solid silhouette interior rings');
});

test('blank mask still fails with a clear silhouette error', () => {
  const message = silhouetteError(new Uint8Array(20 * 20), 20, 20);
  ok(message.includes('No clear person silhouette'), `unexpected error: ${message}`);
});

console.log('Mask Contour regression suite passed.');
