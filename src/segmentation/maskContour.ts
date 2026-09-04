import type { NormalizedPoint } from '../types';

export type MaskContourStrategy = 'boundary' | 'scanline-fallback';

export type MaskContourResult = {
  contour: NormalizedPoint[];
  /** Enclosed background rings belonging to the same selected person component. */
  contourHoles: NormalizedPoint[][];
  foregroundRatio: number;
  strategy: MaskContourStrategy;
};

type PixelPoint = { x: number; y: number };
type Direction = 0 | 1 | 2 | 3;
type BoundaryEdge = {
  id: number;
  start: PixelPoint;
  end: PixelPoint;
  direction: Direction;
};

type TracedTopology = {
  contour: NormalizedPoint[];
  contourHoles: NormalizedPoint[][];
};

const MIN_CONTOUR_POINTS = 24;
const MAX_CONTOUR_POINTS = 128;
const MIN_HOLE_POINTS = 12;
const MAX_HOLE_POINTS = 64;
const MAX_HOLE_RINGS = 4;
const MIN_HOLE_AREA_PIXELS = 12;
const MIN_HOLE_AREA_RATIO = 0.0015;
const MIN_HOLE_SPAN_PIXELS = 3;

function hasLegacyCompatibleComponentEvidence(component: number[], width: number) {
  // Preserve the old extractor's practical small-subject eligibility without
  // tying acceptance to a resolution-dependent percentage of the whole mask.
  const minimumRowForeground = Math.max(2, width * 0.006);
  const rowCounts = new Map<number, number>();
  component.forEach((index) => {
    const y = Math.floor(index / width);
    rowCounts.set(y, (rowCounts.get(y) ?? 0) + 1);
  });

  let usableRows = 0;
  for (const count of rowCounts.values()) {
    if (count > minimumRowForeground) usableRows += 1;
    if (usableRows >= 8) return true;
  }
  return false;
}

function assertMaskShape(mask: ArrayLike<number>, width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Person mask dimensions are invalid.');
  }
  if (mask.length < width * height) {
    throw new Error('Person mask data is incomplete.');
  }
}

function buildBinaryMask(mask: ArrayLike<number>, width: number, height: number) {
  const size = width * height;
  const binary = new Uint8Array(size);
  let foreground = 0;

  for (let index = 0; index < size; index += 1) {
    if (Number(mask[index]) > 0) {
      binary[index] = 1;
      foreground += 1;
    }
  }
  return { binary, foreground };
}

function largestConnectedComponent(binary: Uint8Array, width: number, height: number): number[] {
  const visited = new Uint8Array(binary.length);
  let largest: number[] = [];

  for (let start = 0; start < binary.length; start += 1) {
    if (!binary[start] || visited[start]) continue;

    const component: number[] = [];
    const queue: number[] = [start];
    visited[start] = 1;
    let head = 0;

    while (head < queue.length) {
      const index = queue[head++];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);

      const visit = (nx: number, ny: number) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const next = ny * width + nx;
        if (!binary[next] || visited[next]) return;
        visited[next] = 1;
        queue.push(next);
      };

      visit(x - 1, y);
      visit(x + 1, y);
      visit(x, y - 1);
      visit(x, y + 1);
    }

    if (component.length > largest.length) largest = component;
  }

  return largest;
}

function componentMask(component: number[], size: number) {
  const selected = new Uint8Array(size);
  component.forEach((index) => {
    selected[index] = 1;
  });
  return selected;
}

function polygonArea(points: PixelPoint[]) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function ringSpan(points: PixelPoint[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/**
 * Trace every closed edge loop of one selected 4-connected foreground
 * component. Outer and enclosed-hole loops use opposite winding because every
 * emitted edge keeps foreground on the right side of the walk.
 */
function boundaryLoops(
  selected: Uint8Array,
  component: number[],
  width: number,
  height: number,
): PixelPoint[][] {
  const vertexWidth = width + 1;
  const edges: BoundaryEdge[] = [];
  const outgoing = new Map<number, BoundaryEdge[]>();

  const vertexKey = (point: PixelPoint) => point.y * vertexWidth + point.x;
  const isForeground = (x: number, y: number) =>
    x >= 0 && x < width && y >= 0 && y < height && selected[y * width + x] === 1;

  const addEdge = (start: PixelPoint, end: PixelPoint, direction: Direction) => {
    const edge: BoundaryEdge = { id: edges.length, start, end, direction };
    edges.push(edge);
    const key = vertexKey(start);
    const bucket = outgoing.get(key);
    if (bucket) bucket.push(edge);
    else outgoing.set(key, [edge]);
  };

  component.forEach((index) => {
    const x = index % width;
    const y = Math.floor(index / width);

    if (!isForeground(x, y - 1)) addEdge({ x, y }, { x: x + 1, y }, 0);
    if (!isForeground(x + 1, y)) addEdge({ x: x + 1, y }, { x: x + 1, y: y + 1 }, 1);
    if (!isForeground(x, y + 1)) addEdge({ x: x + 1, y: y + 1 }, { x, y: y + 1 }, 2);
    if (!isForeground(x - 1, y)) addEdge({ x, y: y + 1 }, { x, y }, 3);
  });

  const used = new Uint8Array(edges.length);
  const loops: PixelPoint[][] = [];
  const turnRank = (incoming: Direction, outgoingDirection: Direction) => {
    const delta = (outgoingDirection - incoming + 4) % 4;
    if (delta === 1) return 0; // right
    if (delta === 0) return 1; // straight
    if (delta === 3) return 2; // left
    return 3; // back
  };

  edges.forEach((first) => {
    if (used[first.id]) return;

    const startKey = vertexKey(first.start);
    const points: PixelPoint[] = [first.start];
    let current = first;
    let closed = false;

    for (let step = 0; step <= edges.length; step += 1) {
      used[current.id] = 1;
      points.push(current.end);
      const nextKey = vertexKey(current.end);
      if (nextKey === startKey) {
        closed = true;
        break;
      }

      const candidates = (outgoing.get(nextKey) ?? [])
        .filter((edge) => !used[edge.id])
        .sort((a, b) => turnRank(current.direction, a.direction) - turnRank(current.direction, b.direction));
      if (!candidates.length) break;
      current = candidates[0];
    }

    if (closed && points.length >= 5) {
      points.pop(); // Rings do not repeat the first point at the end.
      loops.push(points);
    }
  });

  return loops;
}

function removeCollinearPixelPoints(points: PixelPoint[]) {
  if (points.length <= 4) return points;
  const result: PixelPoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const dx1 = current.x - previous.x;
    const dy1 = current.y - previous.y;
    const dx2 = next.x - current.x;
    const dy2 = next.y - current.y;
    if (dx1 * dy2 - dy1 * dx2 !== 0) result.push(current);
  }

  return result.length >= 4 ? result : points;
}

function resampleClosed(points: NormalizedPoint[], targetCount: number): NormalizedPoint[] {
  if (points.length < 2 || targetCount <= 0) return points;

  const segmentLengths: number[] = [];
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const length = Math.hypot(next.x - current.x, next.y - current.y);
    segmentLengths.push(length);
    total += length;
  }
  if (total <= 1e-9) return points;

  const result: NormalizedPoint[] = [];
  let segmentIndex = 0;
  let segmentStartDistance = 0;

  for (let sample = 0; sample < targetCount; sample += 1) {
    const targetDistance = total * sample / targetCount;
    while (
      segmentIndex < segmentLengths.length - 1
      && segmentStartDistance + segmentLengths[segmentIndex] < targetDistance
    ) {
      segmentStartDistance += segmentLengths[segmentIndex];
      segmentIndex += 1;
    }

    const start = points[segmentIndex];
    const end = points[(segmentIndex + 1) % points.length];
    const length = Math.max(1e-9, segmentLengths[segmentIndex]);
    const t = Math.max(0, Math.min(1, (targetDistance - segmentStartDistance) / length));
    result.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    });
  }

  return result;
}

function boundedRing(
  pixelPoints: PixelPoint[],
  width: number,
  height: number,
  minPoints: number,
  maxPoints: number,
) {
  let normalized = removeCollinearPixelPoints(pixelPoints).map((point) => ({
    x: Math.max(0, Math.min(1, point.x / width)),
    y: Math.max(0, Math.min(1, point.y / height)),
  }));

  if (normalized.length > maxPoints) normalized = resampleClosed(normalized, maxPoints);
  else if (normalized.length < minPoints) normalized = resampleClosed(normalized, minPoints);

  return normalized;
}

function traceContourTopology(
  selected: Uint8Array,
  component: number[],
  width: number,
  height: number,
): TracedTopology | null {
  const loops = boundaryLoops(selected, component, width, height);
  if (!loops.length) return null;

  const entries = loops
    .map((loop, index) => ({ loop, index, area: polygonArea(loop) }))
    .filter((entry) => entry.loop.length >= 4 && Math.abs(entry.area) >= 4);
  if (!entries.length) return null;

  const outer = entries.reduce((best, entry) =>
    Math.abs(entry.area) > Math.abs(best.area) ? entry : best,
  entries[0]);
  const outerArea = Math.abs(outer.area);
  const minimumHoleArea = Math.max(MIN_HOLE_AREA_PIXELS, outerArea * MIN_HOLE_AREA_RATIO);

  const holes = entries
    .filter((entry) => entry.index !== outer.index)
    .filter((entry) => entry.area * outer.area < 0)
    .filter((entry) => Math.abs(entry.area) >= minimumHoleArea)
    .filter((entry) => {
      const span = ringSpan(entry.loop);
      return span.width >= MIN_HOLE_SPAN_PIXELS && span.height >= MIN_HOLE_SPAN_PIXELS;
    })
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area))
    .slice(0, MAX_HOLE_RINGS)
    .map((entry) => boundedRing(entry.loop, width, height, MIN_HOLE_POINTS, MAX_HOLE_POINTS));

  return {
    contour: boundedRing(outer.loop, width, height, MIN_CONTOUR_POINTS, MAX_CONTOUR_POINTS),
    contourHoles: holes,
  };
}

function scanlineFallback(selected: Uint8Array, width: number, height: number): NormalizedPoint[] {
  const rowStep = Math.max(1, Math.floor(height / 110));
  const left: PixelPoint[] = [];
  const right: PixelPoint[] = [];

  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    let rowForeground = 0;

    for (let x = 0; x < width; x += 1) {
      if (!selected[y * width + x]) continue;
      rowForeground += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }

    if (y % rowStep === 0 && rowForeground > Math.max(1, width * 0.003) && maxX >= minX) {
      left.push({ x: minX, y });
      right.push({ x: maxX + 1, y });
    }
  }

  if (left.length < 4 || right.length < 4) {
    throw new Error('No clear person silhouette was found in this photo.');
  }

  return boundedRing([...left, ...right.reverse()], width, height, MIN_CONTOUR_POINTS, MAX_CONTOUR_POINTS);
}

export function extractPersonContourFromMask(
  mask: ArrayLike<number>,
  width: number,
  height: number,
): MaskContourResult {
  assertMaskShape(mask, width, height);
  const { binary, foreground } = buildBinaryMask(mask, width, height);
  const component = largestConnectedComponent(binary, width, height);

  if (foreground === 0 || !hasLegacyCompatibleComponentEvidence(component, width)) {
    throw new Error('No clear person silhouette was found in this photo.');
  }

  const selected = componentMask(component, width * height);
  const traced = traceContourTopology(selected, component, width, height);
  if (traced && traced.contour.length >= MIN_CONTOUR_POINTS) {
    return {
      ...traced,
      foregroundRatio: foreground / Math.max(1, width * height),
      strategy: 'boundary',
    };
  }

  return {
    contour: scanlineFallback(selected, width, height),
    contourHoles: [],
    foregroundRatio: foreground / Math.max(1, width * height),
    strategy: 'scanline-fallback',
  };
}
