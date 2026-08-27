import type { GuideSpec, NormalizedPoint, PersonGuide } from './types';

type SampleLike = { id: string; guide: GuideSpec };

/**
 * First manually source-reviewed sample. Coordinates were calibrated against
 * the actual 3:4 Low squat reference displayed by the app rather than the
 * generic reusable squat pose family.
 */
const LOW_SQUAT_CONTOUR: NormalizedPoint[] = [
  { x: 0.49, y: 0.06 }, { x: 0.55, y: 0.08 }, { x: 0.59, y: 0.12 },
  { x: 0.61, y: 0.18 }, { x: 0.61, y: 0.26 }, { x: 0.63, y: 0.31 },
  { x: 0.66, y: 0.35 }, { x: 0.67, y: 0.44 }, { x: 0.66, y: 0.54 },
  { x: 0.63, y: 0.62 }, { x: 0.71, y: 0.66 }, { x: 0.78, y: 0.70 },
  { x: 0.80, y: 0.77 }, { x: 0.76, y: 0.84 }, { x: 0.68, y: 0.89 },
  { x: 0.64, y: 0.94 }, { x: 0.67, y: 0.98 }, { x: 0.62, y: 1.00 },
  { x: 0.57, y: 0.97 }, { x: 0.56, y: 0.91 }, { x: 0.58, y: 0.83 },
  { x: 0.54, y: 0.74 }, { x: 0.50, y: 0.69 }, { x: 0.45, y: 0.74 },
  { x: 0.41, y: 0.83 }, { x: 0.39, y: 0.91 }, { x: 0.39, y: 0.98 },
  { x: 0.31, y: 0.99 }, { x: 0.30, y: 0.93 }, { x: 0.34, y: 0.89 },
  { x: 0.27, y: 0.87 }, { x: 0.22, y: 0.82 }, { x: 0.21, y: 0.76 },
  { x: 0.23, y: 0.70 }, { x: 0.32, y: 0.67 }, { x: 0.36, y: 0.65 },
  { x: 0.30, y: 0.61 }, { x: 0.26, y: 0.56 }, { x: 0.25, y: 0.48 },
  { x: 0.26, y: 0.40 }, { x: 0.30, y: 0.35 }, { x: 0.38, y: 0.31 },
  { x: 0.40, y: 0.22 }, { x: 0.41, y: 0.14 }, { x: 0.45, y: 0.08 },
];

const LOW_SQUAT_PERSON: PersonGuide = {
  contour: LOW_SQUAT_CONTOUR,
  head: { center: { x: 0.49, y: 0.235 }, rx: 0.073, ry: 0.092, facing: 'front' },
  // MediaPipe names left/right anatomically: for this front-facing person,
  // her left side is on the viewer's right side of the frame.
  shoulders: {
    left: { x: 0.62, y: 0.36 },
    right: { x: 0.36, y: 0.36 },
  },
  torso: {
    top: { x: 0.49, y: 0.38 },
    bottom: { x: 0.49, y: 0.675 },
    width: 0.26,
  },
  joints: {
    leftElbow: { x: 0.64, y: 0.56 },
    leftWrist: { x: 0.52, y: 0.785 },
    rightElbow: { x: 0.27, y: 0.55 },
    rightWrist: { x: 0.44, y: 0.785 },
    leftHip: { x: 0.56, y: 0.675 },
    rightHip: { x: 0.42, y: 0.675 },
    leftKnee: { x: 0.70, y: 0.75 },
    rightKnee: { x: 0.33, y: 0.76 },
    leftAnkle: { x: 0.61, y: 0.93 },
    rightAnkle: { x: 0.33, y: 0.93 },
  },
};

export function applySourceDerivedSampleOverride<T extends SampleLike>(sample: T): T {
  if (sample.id !== 'low-squat') return sample;

  return {
    ...sample,
    guide: {
      ...sample.guide,
      people: [LOW_SQUAT_PERSON],
      crop: 'full',
      lookSpace: 'center',
      fidelity: 'source-derived',
      lensHint: { zoom: 1, basis: 'crop-heuristic' },
      transform: { dx: 0, dy: 0, scale: 1 },
    },
  } as T;
}
