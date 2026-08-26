export type GuideMode = 'simple' | 'outline';
export type GuideKind = 'portrait' | 'food';

export type NormalizedPoint = { x: number; y: number };

export type GuideTransform = {
  dx: number;
  dy: number;
  scale: number;
};

/**
 * Pose joints are internal geometry only. They may be used to derive a fallback
 * contour for presets, but they are never rendered as a skeleton to the user.
 */
export type PoseJoints = {
  leftElbow?: NormalizedPoint;
  rightElbow?: NormalizedPoint;
  leftWrist?: NormalizedPoint;
  rightWrist?: NormalizedPoint;
  leftHip?: NormalizedPoint;
  rightHip?: NormalizedPoint;
  leftKnee?: NormalizedPoint;
  rightKnee?: NormalizedPoint;
  leftAnkle?: NormalizedPoint;
  rightAnkle?: NormalizedPoint;
};

export type PersonGuide = {
  /**
   * Closed outer contour in source-image normalized coordinates.
   * Segmentation-based references should populate this field.
   */
  contour?: NormalizedPoint[];
  head: {
    center: NormalizedPoint;
    rx: number;
    ry: number;
    facing: 'left' | 'right' | 'front';
  };
  shoulders: {
    left: NormalizedPoint;
    right: NormalizedPoint;
  };
  torso: {
    top: NormalizedPoint;
    bottom: NormalizedPoint;
    width: number;
  };
  joints?: PoseJoints;
};

export type ObjectGuide = {
  center: NormalizedPoint;
  rx: number;
  ry: number;
  label: string;
  rotation?: number;
};

export type GuideSpec = {
  kind: GuideKind;
  mode: GuideMode;
  people: PersonGuide[];
  objects?: ObjectGuide[];
  crop: 'headshot' | 'half' | 'three-quarter' | 'full' | 'tabletop';
  lookSpace: 'left' | 'right' | 'center';
  sourceUri?: string;
  /** Source image width / height. Used to keep the guide undistorted in camera. */
  aspectRatio?: number;
  transform: GuideTransform;
};

export const DEFAULT_PERSON: PersonGuide = {
  head: { center: { x: 0.54, y: 0.25 }, rx: 0.085, ry: 0.11, facing: 'left' },
  shoulders: { left: { x: 0.38, y: 0.39 }, right: { x: 0.66, y: 0.37 } },
  torso: { top: { x: 0.52, y: 0.40 }, bottom: { x: 0.48, y: 0.77 }, width: 0.26 },
  joints: {
    leftElbow: { x: 0.32, y: 0.55 },
    leftWrist: { x: 0.38, y: 0.67 },
    rightElbow: { x: 0.70, y: 0.54 },
    rightWrist: { x: 0.64, y: 0.67 },
    leftHip: { x: 0.41, y: 0.70 },
    rightHip: { x: 0.56, y: 0.70 },
  },
};

export const DEFAULT_GUIDE: GuideSpec = {
  kind: 'portrait',
  mode: 'outline',
  people: [DEFAULT_PERSON],
  crop: 'half',
  lookSpace: 'left',
  aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
};
