import { GuideSpec, NormalizedPoint, PersonGuide } from '../types';

export type PersonContourDetection = {
  contour: NormalizedPoint[];
  maskWidth: number;
  maskHeight: number;
  foregroundRatio: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function buildGuideFromContour(
  detection: PersonContourDetection,
  aspectRatio: number,
  sourceUri?: string,
): GuideSpec {
  if (detection.contour.length < 12) {
    throw new Error('The detected person outline is too small to build a guide.');
  }

  const xs = detection.contour.map((point) => point.x);
  const ys = detection.contour.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const bodyWidth = Math.max(0.08, right - left);
  const bodyHeight = Math.max(0.16, bottom - top);
  const centerX = (left + right) / 2;

  const headBandBottom = top + bodyHeight * 0.19;
  const headPoints = detection.contour.filter((point) => point.y <= headBandBottom);
  const headXs = headPoints.length >= 4 ? headPoints.map((point) => point.x) : xs;
  const headLeft = Math.min(...headXs);
  const headRight = Math.max(...headXs);
  const headCenterX = clamp((headLeft + headRight) / 2);
  const headCenterY = clamp(top + bodyHeight * 0.095);
  const headRx = clamp(Math.max(0.035, (headRight - headLeft) * 0.52), 0.035, 0.15);
  const headRy = clamp(Math.max(0.045, bodyHeight * 0.09), 0.045, 0.16);

  const shoulderY = clamp(top + bodyHeight * 0.22);
  const hipY = clamp(top + bodyHeight * 0.57);

  const person: PersonGuide = {
    contour: detection.contour,
    head: {
      center: { x: headCenterX, y: headCenterY },
      rx: headRx,
      ry: headRy,
      facing: 'front',
    },
    shoulders: {
      left: { x: clamp(centerX - bodyWidth * 0.34), y: shoulderY },
      right: { x: clamp(centerX + bodyWidth * 0.34), y: shoulderY },
    },
    torso: {
      top: { x: centerX, y: shoulderY },
      bottom: { x: centerX, y: hipY },
      width: bodyWidth * 0.58,
    },
  };

  const crop: GuideSpec['crop'] = bottom > 0.92
    ? 'full'
    : bottom > 0.78
      ? 'three-quarter'
      : bottom > 0.58
        ? 'half'
        : 'headshot';

  return {
    kind: 'portrait',
    mode: 'outline',
    people: [person],
    crop,
    lookSpace: 'center',
    sourceUri,
    aspectRatio: aspectRatio > 0 ? aspectRatio : 0.75,
    transform: { dx: 0, dy: 0, scale: 1 },
  };
}
