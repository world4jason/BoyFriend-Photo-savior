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
  let message = '';
  try {
    extractPersonContourFromMask(new Uint8Array(20 * 20), 20, 20);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  ok(message.includes('No clear person silhouette'), `unexpected error: ${message}`);
});

console.log('Mask Contour regression suite passed.');
