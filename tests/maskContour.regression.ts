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

function assertBoundedNormalizedContour(contour: NormalizedPoint[]) {
  ok(contour.length >= 24, `expected at least 24 contour points, got ${contour.length}`);
  ok(contour.length <= 128, `expected at most 128 contour points, got ${contour.length}`);
  contour.forEach((point, index) => {
    ok(Number.isFinite(point.x) && Number.isFinite(point.y), `point ${index} must be finite`);
    ok(point.x >= 0 && point.x <= 1, `point ${index}.x must stay normalized`);
    ok(point.y >= 0 && point.y <= 1, `point ${index}.y must stay normalized`);
  });
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

test('single-ring contour chooses the outer boundary when the component contains a hole', () => {
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

  const xs = result.contour.map((point) => point.x);
  const ys = result.contour.map((point) => point.y);
  ok(Math.min(...xs) <= 5 / width + 0.001, 'outer left edge should be preserved');
  ok(Math.max(...xs) >= 27 / width - 0.001, 'outer right edge should be preserved');
  ok(Math.min(...ys) <= 4 / height + 0.001, 'outer top edge should be preserved');
  ok(Math.max(...ys) >= 28 / height - 0.001, 'outer bottom edge should be preserved');
  ok(
    pointInPolygon({ x: 15 / width, y: 15 / height }, result.contour),
    'current one-ring GuideSpec intentionally represents the outer loop rather than an interior hole ring',
  );
});

test('blank mask still fails with a clear silhouette error', () => {
  const message = silhouetteError(new Uint8Array(20 * 20), 20, 20);
  ok(message.includes('No clear person silhouette'), `unexpected error: ${message}`);
});

console.log('Mask Contour regression suite passed.');
