import type { NormalizedPoint } from '../types';

export type MaskContourStrategy = 'boundary' | 'scanline-fallback';

export type MaskContourResult = {
  contour: NormalizedPoint[];
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

const MIN_CONTOUR_POINTS = 24;
const MAX_CONTOUR_POINTS = 128;

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

function boundaryLoops(selected: Uint8Array, component: number[], width: number, height: number): PixelPoint[][] {
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

    // Clockwise edges keep foreground on the right side of the walk.
    if (!isForeground(x, y - 1)) addEdge({ x, y }, { x: x + 1, y }, 0);
    if (!isForeground(x + 1, y)) addEdge({ x: x + 1, y }, { x: x + 1, y: y + 1 }, 1);
    if (!isForeground(x, y + 1)) addEdge({ x: x + 1, y: y + 1 }, { x, y: y + 1 }, 2);
    if (!isForeground(x - 1, y)) addEdge({ x, y: y + 1 }, { x, y }, 3);
  });

  const used = new Uint8Array(edges.length);
  const loops: PixelPoint[][] = [];
  const turnRank = (incoming: Direction, outgoingDirection: Direction) => {
    const delta = (outgoingDirection - incoming + 4) % 4;
    // Right, straight, left, back. This resolves rare corner ambiguities while
    // preserving the foreground-on-right boundary walk.
    if (delta === 1) return 0;
    if (delta === 0) return 1;
    if (delta === 3) return 2;
    return 3;
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
      points.pop(); // GuideSpec rings do not repeat the first point at the end.
      loops.push(points);
    }
  });

  return loops;
}

function pointSegmentDistance(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
  ));
  const px = start.x + t * dx;
  const py = start.y + t * dy;
  return Math.hypot(point.x - px, point.y - py);
}

function simplifyOpen(points: NormalizedPoint[], epsilon: number): NormalizedPoint[] {
  if (points.length <= 2) return points;
  const start = points[0];
  const end = points[points.length - 1];
  let farthestIndex = -1;
  let farthestDistance = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointSegmentDistance(points[index], start, end);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }

  if (farthestIndex < 0 || farthestDistance <= epsilon) return [start, end];
  const left = simplifyOpen(points.slice(0, farthestIndex + 1), epsilon);
  const right = simplifyOpen(points.slice(farthestIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

function simplifyClosed(points: NormalizedPoint[], epsilon: number): NormalizedPoint[] {
  if (points.length <= 4) return points;
  const anchor = points[0];
  let oppositeIndex = 1;
  let farthestDistance = -1;

  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.hypot(points[index].x - anchor.x, points[index].y - anchor.y);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      oppositeIndex = index;
    }
  }

  const firstHalf = simplifyOpen(points.slice(0, oppositeIndex + 1), epsilon);
  const secondHalf = simplifyOpen([...points.slice(oppositeIndex), anchor], epsilon);
  const merged = [...firstHalf, ...secondHalf.slice(1, -1)];
  return merged.length >= 4 ? merged : points;
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

function boundedContour(points: NormalizedPoint[], width: number, height: number) {
  const baseEpsilon = Math.max(
    0.0015,
    Math.min(0.006, 0.75 / Math.max(1, Math.min(width, height))),
  );
  let epsilon = baseEpsilon;
  let simplified = simplifyClosed(points, epsilon);

  for (let attempt = 0; attempt < 8 && simplified.length > MAX_CONTOUR_POINTS; attempt += 1) {
    epsilon *= 1.35;
    simplified = simplifyClosed(points, epsilon);
  }

  if (simplified.length > MAX_CONTOUR_POINTS) {
    simplified = resampleClosed(simplified, MAX_CONTOUR_POINTS);
  } else if (simplified.length < MIN_CONTOUR_POINTS) {
    simplified = resampleClosed(simplified, MIN_CONTOUR_POINTS);
  }

  return simplified.map((point) => ({
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  }));
}

function traceOuterContour(
  selected: Uint8Array,
  component: number[],
  width: number,
  height: number,
): NormalizedPoint[] | null {
  const loops = boundaryLoops(selected, component, width, height);
  if (!loops.length) return null;

  const outer = loops.reduce((best, loop) =>
    Math.abs(polygonArea(loop)) > Math.abs(polygonArea(best)) ? loop : best,
  loops[0]);
  if (outer.length < 4 || Math.abs(polygonArea(outer)) < 4) return null;

  const normalized = outer.map((point) => ({
    x: point.x / width,
    y: point.y / height,
  }));
  return boundedContour(normalized, width, height);
}

function scanlineFallback(selected: Uint8Array, width: number, height: number): NormalizedPoint[] {
  const rowStep = Math.max(1, Math.floor(height / 110));
  const left: NormalizedPoint[] = [];
  const right: NormalizedPoint[] = [];

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
      left.push({ x: minX / width, y: y / height });
      right.push({ x: (maxX + 1) / width, y: y / height });
    }
  }

  if (left.length < 4 || right.length < 4) {
    throw new Error('No clear person silhouette was found in this photo.');
  }

  return boundedContour([...left, ...right.reverse()], width, height);
}

export function extractPersonContourFromMask(
  mask: ArrayLike<number>,
  width: number,
  height: number,
): MaskContourResult {
  assertMaskShape(mask, width, height);
  const { binary, foreground } = buildBinaryMask(mask, width, height);
  const minimumComponent = Math.max(12, Math.floor(width * height * 0.001));
  const component = largestConnectedComponent(binary, width, height);

  if (foreground === 0 || component.length < minimumComponent) {
    throw new Error('No clear person silhouette was found in this photo.');
  }

  const selected = componentMask(component, width * height);
  const traced = traceOuterContour(selected, component, width, height);
  if (traced && traced.length >= MIN_CONTOUR_POINTS) {
    return {
      contour: traced,
      foregroundRatio: foreground / Math.max(1, width * height),
      strategy: 'boundary',
    };
  }

  return {
    contour: scanlineFallback(selected, width, height),
    foregroundRatio: foreground / Math.max(1, width * height),
    strategy: 'scanline-fallback',
  };
}
