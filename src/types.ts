export type GuideMode = 'simple' | 'outline';
export type GuideKind = 'portrait' | 'food' | 'scene';

/** Product-facing display-mode identifiers. */
export type DisplayMode = 'outline' | 'skeleton' | 'ghost' | 'guide';

/**
 * Legacy benchmark-shaped renderer keys used by older template/sample data.
 * New product/domain state should use DisplayMode instead.
 */
export type BenchmarkPresetKey = 'sovs' | 'poseoverlay' | 'poseghost' | 'recompose';
/** @deprecated Use DisplayMode for product state; this alias remains for old template data. */
export type GuidePreset = BenchmarkPresetKey;
/** @deprecated Compatibility alias for legacy sample/template visualStyle fields. */
export type GuideVisualStyle = BenchmarkPresetKey;

export type TemplateFidelity = 'source-derived' | 'approximate';
export type LensHintBasis = 'exif-35mm' | 'template' | 'crop-heuristic';
export type LensHint = {
  /** Photographer-facing camera selector hint, not an enforced CameraView zoom value. */
  zoom: 0.5 | 1 | 2 | 3;
  basis: LensHintBasis;
  equivalentMm?: number;
};

export type NormalizedPoint = { x: number; y: number };

export type GuideTransform = {
  dx: number;
  dy: number;
  scale: number;
};

export type GuideAnnotation =
  | {
      type: 'line';
      from: NormalizedPoint;
      to: NormalizedPoint;
      label?: string;
      dashed?: boolean;
    }
  | {
      type: 'zone';
      center: NormalizedPoint;
      rx: number;
      ry: number;
      label?: string;
      rotation?: number;
    }
  | {
      type: 'point';
      position: NormalizedPoint;
      label?: string;
    }
  | {
      type: 'frame';
      left: number;
      top: number;
      right: number;
      bottom: number;
      label?: string;
    };

/**
 * Pose joints are shared geometry. They stay hidden in Outline/Ghost/Guide
 * modes, but are intentionally rendered when the user explicitly chooses
 * Skeleton mode.
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
  /** Closed outer contour in source-image normalized coordinates. */
  contour?: NormalizedPoint[];
  /**
   * Optional enclosed background rings from the same source silhouette.
   * These are source-derived negative-space boundaries, not pose/skeleton lines.
   */
  contourHoles?: NormalizedPoint[][];
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
  /** Legacy object sub-style; not one of the four product display modes. */
  mode: GuideMode;
  /** Canonical product-facing display mode. */
  displayMode?: DisplayMode;
  /** @deprecated Legacy benchmark-shaped renderer key for old template/sample data. */
  visualStyle?: BenchmarkPresetKey;
  people: PersonGuide[];
  objects?: ObjectGuide[];
  annotations?: GuideAnnotation[];
  crop: 'headshot' | 'half' | 'three-quarter' | 'full' | 'tabletop' | 'scene';
  lookSpace: 'left' | 'right' | 'center';
  sourceUri?: string;
  /** Whether geometry came from the exact source image or is only a POC approximation. */
  fidelity?: TemplateFidelity;
  /** Suggested physical camera selector. This never changes matching geometry by itself. */
  lensHint?: LensHint;
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
  displayMode: 'outline',
  people: [DEFAULT_PERSON],
  crop: 'half',
  lookSpace: 'left',
  fidelity: 'approximate',
  lensHint: { zoom: 2, basis: 'crop-heuristic' },
  aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
};
