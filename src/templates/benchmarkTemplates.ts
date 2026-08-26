import { GuideAnnotation, GuidePreset, GuideSpec, NormalizedPoint, PersonGuide } from '../types';

export type BenchmarkTemplate = {
  id: string;
  title: string;
  category: string;
  inspiredBy: 'PoseOverlay' | 'SOVS2' | 'PoseGhost' | 'reCompose';
  sourceUrl: string;
  defaultPreset: GuidePreset;
  guide: GuideSpec;
};

type Facing = PersonGuide['head']['facing'];

type PoseName =
  | 'power' | 'hip-pop' | 'walk' | 'arms-crossed' | 'natural' | 'lean'
  | 'step' | 'seated-forward' | 'arm-on-knee' | 'over-shoulder' | 'squat' | 'twirl';

const head = (x: number, y: number, facing: Facing = 'front') => ({
  center: { x, y }, rx: 0.064, ry: 0.084, facing,
});

function posePerson(name: PoseName, x = 0.5, y = 0, facing: Facing = 'front'): PersonGuide {
  const p = (dx: number, dy: number): NormalizedPoint => ({ x: x + dx, y: y + dy });

  if (name === 'power') return {
    head: head(x, y + 0.20, facing),
    shoulders: { left: p(-0.12, 0.31), right: p(0.12, 0.31) },
    torso: { top: p(0, 0.33), bottom: p(0, 0.58), width: 0.22 },
    joints: {
      leftElbow: p(-0.19, 0.44), leftWrist: p(-0.09, 0.55),
      rightElbow: p(0.19, 0.44), rightWrist: p(0.09, 0.55),
      leftHip: p(-0.07, 0.58), rightHip: p(0.07, 0.58),
      leftKnee: p(-0.10, 0.76), rightKnee: p(0.10, 0.76),
      leftAnkle: p(-0.14, 0.95), rightAnkle: p(0.14, 0.95),
    },
  };

  if (name === 'hip-pop') return {
    head: head(x + 0.02, y + 0.20, facing),
    shoulders: { left: p(-0.11, 0.31), right: p(0.12, 0.33) },
    torso: { top: p(0.01, 0.33), bottom: p(0.05, 0.59), width: 0.21 },
    joints: {
      leftElbow: p(-0.18, 0.43), leftWrist: p(-0.08, 0.54),
      rightElbow: p(0.18, 0.46), rightWrist: p(0.11, 0.58),
      leftHip: p(-0.02, 0.58), rightHip: p(0.12, 0.60),
      leftKnee: p(-0.03, 0.77), rightKnee: p(0.14, 0.75),
      leftAnkle: p(-0.07, 0.95), rightAnkle: p(0.21, 0.91),
    },
  };

  if (name === 'walk' || name === 'step') return {
    head: head(x + 0.01, y + 0.20, facing),
    shoulders: { left: p(-0.10, 0.31), right: p(0.11, 0.32) },
    torso: { top: p(0, 0.33), bottom: p(0, 0.59), width: 0.20 },
    joints: {
      leftElbow: p(-0.15, 0.45), leftWrist: p(-0.19, 0.59),
      rightElbow: p(0.15, 0.44), rightWrist: p(0.20, 0.56),
      leftHip: p(-0.06, 0.59), rightHip: p(0.06, 0.59),
      leftKnee: p(-0.11, 0.77), rightKnee: p(0.12, 0.74),
      leftAnkle: p(-0.19, 0.94), rightAnkle: p(0.19, 0.90),
    },
  };

  if (name === 'arms-crossed') return {
    head: head(x, y + 0.22, facing),
    shoulders: { left: p(-0.12, 0.34), right: p(0.12, 0.34) },
    torso: { top: p(0, 0.35), bottom: p(0, 0.62), width: 0.22 },
    joints: {
      leftElbow: p(-0.16, 0.47), leftWrist: p(0.08, 0.49),
      rightElbow: p(0.16, 0.47), rightWrist: p(-0.08, 0.50),
      leftHip: p(-0.07, 0.61), rightHip: p(0.07, 0.61),
      leftKnee: p(-0.07, 0.79), rightKnee: p(0.08, 0.79),
      leftAnkle: p(-0.08, 0.96), rightAnkle: p(0.09, 0.96),
    },
  };

  if (name === 'natural') return {
    head: head(x, y + 0.21, facing),
    shoulders: { left: p(-0.11, 0.33), right: p(0.11, 0.34) },
    torso: { top: p(0, 0.35), bottom: p(0.02, 0.61), width: 0.21 },
    joints: {
      leftElbow: p(-0.14, 0.48), leftWrist: p(-0.10, 0.61),
      rightElbow: p(0.15, 0.48), rightWrist: p(0.08, 0.60),
      leftHip: p(-0.05, 0.61), rightHip: p(0.09, 0.61),
      leftKnee: p(-0.05, 0.79), rightKnee: p(0.11, 0.78),
      leftAnkle: p(-0.07, 0.96), rightAnkle: p(0.14, 0.95),
    },
  };

  if (name === 'lean') return {
    head: head(x - 0.02, y + 0.22, facing),
    shoulders: { left: p(-0.13, 0.35), right: p(0.09, 0.32) },
    torso: { top: p(-0.02, 0.35), bottom: p(0.04, 0.62), width: 0.20 },
    joints: {
      leftElbow: p(-0.18, 0.49), leftWrist: p(-0.16, 0.62),
      rightElbow: p(0.14, 0.45), rightWrist: p(0.12, 0.59),
      leftHip: p(-0.02, 0.61), rightHip: p(0.10, 0.62),
      leftKnee: p(-0.03, 0.80), rightKnee: p(0.12, 0.77),
      leftAnkle: p(-0.05, 0.96), rightAnkle: p(0.18, 0.93),
    },
  };

  if (name === 'seated-forward') return {
    head: head(x, y + 0.31, facing),
    shoulders: { left: p(-0.12, 0.42), right: p(0.12, 0.42) },
    torso: { top: p(0, 0.43), bottom: p(0.01, 0.61), width: 0.22 },
    joints: {
      leftElbow: p(-0.14, 0.55), leftWrist: p(-0.03, 0.66),
      rightElbow: p(0.14, 0.55), rightWrist: p(0.03, 0.66),
      leftHip: p(-0.08, 0.61), rightHip: p(0.08, 0.61),
      leftKnee: p(-0.14, 0.72), rightKnee: p(0.14, 0.72),
      leftAnkle: p(-0.18, 0.86), rightAnkle: p(0.18, 0.86),
    },
  };

  if (name === 'arm-on-knee') return {
    head: head(x, y + 0.29, facing),
    shoulders: { left: p(-0.11, 0.40), right: p(0.12, 0.40) },
    torso: { top: p(0, 0.41), bottom: p(0, 0.60), width: 0.21 },
    joints: {
      leftElbow: p(-0.17, 0.53), leftWrist: p(-0.10, 0.66),
      rightElbow: p(0.17, 0.51), rightWrist: p(0.18, 0.63),
      leftHip: p(-0.07, 0.60), rightHip: p(0.07, 0.60),
      leftKnee: p(-0.17, 0.72), rightKnee: p(0.12, 0.69),
      leftAnkle: p(-0.16, 0.87), rightAnkle: p(-0.02, 0.79),
    },
  };

  if (name === 'over-shoulder') return {
    head: head(x + 0.04, y + 0.24, facing === 'front' ? 'left' : facing),
    shoulders: { left: p(-0.05, 0.35), right: p(0.15, 0.34) },
    torso: { top: p(0.05, 0.36), bottom: p(0.02, 0.65), width: 0.19 },
    joints: {
      leftElbow: p(-0.07, 0.50), leftWrist: p(-0.04, 0.65),
      rightElbow: p(0.17, 0.50), rightWrist: p(0.12, 0.61),
      leftHip: p(-0.03, 0.64), rightHip: p(0.08, 0.64),
      leftKnee: p(-0.04, 0.81), rightKnee: p(0.08, 0.81),
      leftAnkle: p(-0.05, 0.96), rightAnkle: p(0.09, 0.96),
    },
  };

  if (name === 'squat') return {
    head: head(x, y + 0.27, facing),
    shoulders: { left: p(-0.13, 0.38), right: p(0.12, 0.38) },
    torso: { top: p(0, 0.39), bottom: p(-0.02, 0.56), width: 0.23 },
    joints: {
      leftElbow: p(-0.20, 0.49), leftWrist: p(-0.10, 0.61),
      rightElbow: p(0.17, 0.50), rightWrist: p(0.09, 0.62),
      leftHip: p(-0.10, 0.56), rightHip: p(0.07, 0.56),
      leftKnee: p(-0.24, 0.72), rightKnee: p(0.19, 0.72),
      leftAnkle: p(-0.13, 0.88), rightAnkle: p(0.09, 0.88),
    },
  };

  return {
    head: head(x, y + 0.22, facing),
    shoulders: { left: p(-0.11, 0.34), right: p(0.11, 0.34) },
    torso: { top: p(0, 0.35), bottom: p(0, 0.61), width: 0.21 },
    joints: {
      leftElbow: p(-0.20, 0.43), leftWrist: p(-0.27, 0.33),
      rightElbow: p(0.20, 0.43), rightWrist: p(0.28, 0.33),
      leftHip: p(-0.07, 0.61), rightHip: p(0.07, 0.61),
      leftKnee: p(-0.15, 0.77), rightKnee: p(0.12, 0.77),
      leftAnkle: p(-0.22, 0.92), rightAnkle: p(0.17, 0.94),
    },
  };
}

const portraitGuide = (
  people: PersonGuide[], crop: GuideSpec['crop'], lookSpace: GuideSpec['lookSpace'], preset: GuidePreset,
): GuideSpec => ({
  kind: 'portrait', mode: 'outline', visualStyle: preset, people, crop, lookSpace,
  aspectRatio: 0.75, transform: { dx: 0, dy: 0, scale: 1 },
});

const foodGuide = (objects: NonNullable<GuideSpec['objects']>, annotations: GuideAnnotation[] = []): GuideSpec => ({
  kind: 'food', mode: 'simple', visualStyle: 'recompose', people: [], objects, annotations,
  crop: 'tabletop', lookSpace: 'center', aspectRatio: 0.75, transform: { dx: 0, dy: 0, scale: 1 },
});

const sceneGuide = (annotations: GuideAnnotation[]): GuideSpec => ({
  kind: 'scene', mode: 'simple', visualStyle: 'recompose', people: [], annotations,
  crop: 'scene', lookSpace: 'center', aspectRatio: 0.75, transform: { dx: 0, dy: 0, scale: 1 },
});

const poseTemplate = (
  id: string, title: string, category: string, pose: PoseName, preset: GuidePreset,
  inspiredBy: BenchmarkTemplate['inspiredBy'], sourceUrl: string, facing: Facing = 'front',
): BenchmarkTemplate => ({
  id, title, category, inspiredBy, sourceUrl, defaultPreset: preset,
  guide: portraitGuide([posePerson(pose, 0.50, 0, facing)], 'full', facing === 'front' ? 'center' : facing, preset),
});

const POSE_OVERLAY = 'https://poseoverlay.com/';
const POSE_OVERLAY_GUIDE = 'https://poseoverlay.com/blog/how-to-pose-for-photos/';
const POSE_OVERLAY_MEN = 'https://poseoverlay.com/blog/mens-posing-guide/';
const POSE_OVERLAY_MOVE = 'https://poseoverlay.com/blog/movement-in-photos';
const SOVS = 'https://apppage.net/preview/me.sovs.sovs2';
const POSE_GHOST = 'https://play.google.com/store/apps/details?id=nz.dev.poseghost';
const RECOMPOSE = 'https://recompose.camera/';

const skeletonTemplates: BenchmarkTemplate[] = [
  poseTemplate('sk-power-stance', 'Power stance', 'Skeleton / Solo', 'power', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY),
  poseTemplate('sk-hip-pop', 'Hip pop', 'Skeleton / Solo', 'hip-pop', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY),
  poseTemplate('sk-casual-walk', 'Casual walk', 'Skeleton / Movement', 'walk', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY),
  poseTemplate('sk-arms-crossed', 'Arms crossed', 'Skeleton / Solo', 'arms-crossed', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY),
  poseTemplate('sk-natural', 'The Natural', 'Skeleton / Solo', 'natural', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_GUIDE),
  poseTemplate('sk-look-away', 'Look away', 'Skeleton / Portrait', 'natural', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_GUIDE, 'right'),
  poseTemplate('sk-wall-lean', 'Wall lean', 'Skeleton / Lifestyle', 'lean', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_MEN),
  poseTemplate('sk-step-forward', 'Step forward', 'Skeleton / Movement', 'step', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_MEN),
  poseTemplate('sk-seated-forward', 'Forward lean', 'Skeleton / Seated', 'seated-forward', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_MEN),
  poseTemplate('sk-arm-knee', 'Arm on knee', 'Skeleton / Seated', 'arm-on-knee', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_MEN),
  poseTemplate('sk-lookback-walk', 'Look-back walk', 'Skeleton / Movement', 'over-shoulder', 'poseoverlay', 'PoseOverlay', POSE_OVERLAY_MOVE, 'left'),
  {
    id: 'sk-couple-walk', title: 'Couple walk', category: 'Skeleton / Couple', inspiredBy: 'PoseOverlay',
    sourceUrl: POSE_OVERLAY_GUIDE, defaultPreset: 'poseoverlay',
    guide: portraitGuide([posePerson('walk', 0.38, 0.02, 'right'), posePerson('walk', 0.64, 0, 'left')], 'full', 'center', 'poseoverlay'),
  },
  {
    id: 'sk-forehead-touch', title: 'Forehead touch', category: 'Skeleton / Couple', inspiredBy: 'PoseOverlay',
    sourceUrl: POSE_OVERLAY_GUIDE, defaultPreset: 'poseoverlay',
    guide: portraitGuide([posePerson('natural', 0.42, 0.04, 'right'), posePerson('natural', 0.59, 0.04, 'left')], 'full', 'center', 'poseoverlay'),
  },
];

const outlineTemplates: BenchmarkTemplate[] = [
  poseTemplate('ol-relaxed', 'Relaxed full body', 'Outline / Solo', 'natural', 'sovs', 'SOVS2', SOVS, 'right'),
  poseTemplate('ol-wall-lean', 'Wall lean', 'Outline / Solo', 'lean', 'sovs', 'SOVS2', SOVS, 'right'),
  poseTemplate('ol-seated', 'Seated compact', 'Outline / Seated', 'seated-forward', 'sovs', 'SOVS2', SOVS),
  poseTemplate('ol-low-squat', 'Low squat', 'Outline / Full body', 'squat', 'sovs', 'SOVS2', SOVS),
  poseTemplate('ol-over-shoulder', 'Look back', 'Outline / Full body', 'over-shoulder', 'sovs', 'SOVS2', SOVS, 'left'),
  {
    id: 'ol-duo-side', title: 'Duo side by side', category: 'Outline / Duo', inspiredBy: 'SOVS2', sourceUrl: SOVS,
    defaultPreset: 'sovs', guide: portraitGuide([posePerson('natural', 0.38, 0.02), posePerson('natural', 0.64, 0)], 'full', 'center', 'sovs'),
  },
  {
    id: 'ol-couple-close', title: 'Couple close', category: 'Outline / Couple', inspiredBy: 'SOVS2', sourceUrl: SOVS,
    defaultPreset: 'sovs', guide: portraitGuide([posePerson('natural', 0.43, 0.05, 'right'), posePerson('natural', 0.59, 0.04, 'left')], 'full', 'center', 'sovs'),
  },
  {
    id: 'ol-trio-stagger', title: 'Three-person stagger', category: 'Outline / Group', inspiredBy: 'SOVS2', sourceUrl: SOVS,
    defaultPreset: 'sovs', guide: portraitGuide([
      posePerson('natural', 0.28, 0.05), posePerson('natural', 0.50, 0), posePerson('natural', 0.72, 0.07),
    ], 'full', 'center', 'sovs'),
  },
];

const ghostTemplates: BenchmarkTemplate[] = [
  poseTemplate('gh-full-body', 'Female full body', 'Ghost / Female', 'hip-pop', 'poseghost', 'PoseGhost', POSE_GHOST),
  poseTemplate('gh-seated', 'Seated pose', 'Ghost / Female', 'seated-forward', 'poseghost', 'PoseGhost', POSE_GHOST),
  poseTemplate('gh-walking', 'Walking pose', 'Ghost / Female', 'walk', 'poseghost', 'PoseGhost', POSE_GHOST),
  poseTemplate('gh-over-shoulder', 'Over the shoulder', 'Ghost / Female', 'over-shoulder', 'poseghost', 'PoseGhost', POSE_GHOST, 'left'),
  poseTemplate('gh-male-relaxed', 'Male relaxed stance', 'Ghost / Male', 'natural', 'poseghost', 'PoseGhost', POSE_GHOST),
  {
    id: 'gh-couple-hug', title: 'Couple hug', category: 'Ghost / Couple', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([posePerson('natural', 0.43, 0.05, 'right'), posePerson('natural', 0.59, 0.04, 'left')], 'full', 'center', 'poseghost'),
  },
  {
    id: 'gh-hand-hold', title: 'Hand hold', category: 'Ghost / Couple', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([posePerson('walk', 0.38, 0.03, 'right'), posePerson('walk', 0.64, 0, 'left')], 'full', 'center', 'poseghost'),
  },
  {
    id: 'gh-twirl', title: 'Couple twirl', category: 'Ghost / Couple', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([posePerson('natural', 0.35, 0.04, 'right'), posePerson('twirl', 0.61, 0, 'left')], 'full', 'center', 'poseghost'),
  },
  {
    id: 'gh-back-to-back', title: 'Back to back', category: 'Ghost / Couple', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([posePerson('lean', 0.40, 0.03, 'left'), posePerson('lean', 0.61, 0, 'right')], 'full', 'center', 'poseghost'),
  },
  {
    id: 'gh-wedding-close', title: 'Wedding close', category: 'Ghost / Wedding', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([posePerson('natural', 0.43, 0.07, 'right'), posePerson('natural', 0.58, 0.06, 'left')], 'full', 'center', 'poseghost'),
  },
  {
    id: 'gh-friends-three', title: 'Friends three', category: 'Ghost / Friends & Groups', inspiredBy: 'PoseGhost', sourceUrl: POSE_GHOST,
    defaultPreset: 'poseghost', guide: portraitGuide([
      posePerson('hip-pop', 0.29, 0.05), posePerson('power', 0.50, 0), posePerson('hip-pop', 0.71, 0.05),
    ], 'full', 'center', 'poseghost'),
  },
];

const guideTemplates: BenchmarkTemplate[] = [
  // Portrait — reCompose lists eye lines, look space, two-person staggering and deliberate symmetry.
  {
    id: 'gd-portrait-eye-line', title: 'Eye line', category: 'Guide / Portrait', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: portraitGuide([posePerson('natural', 0.50, 0.10)], 'three-quarter', 'center', 'recompose'),
  },
  {
    id: 'gd-portrait-look-space', title: 'Look space', category: 'Guide / Portrait', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: portraitGuide([posePerson('natural', 0.68, 0.08, 'left')], 'three-quarter', 'left', 'recompose'),
  },
  {
    id: 'gd-two-person-stagger', title: 'Two-person stagger', category: 'Guide / Portrait', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: portraitGuide([posePerson('natural', 0.40, 0.10, 'right'), posePerson('natural', 0.63, 0.02, 'left')], 'three-quarter', 'center', 'recompose'),
  },
  {
    id: 'gd-portrait-symmetry', title: 'Deliberate symmetry', category: 'Guide / Portrait', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: portraitGuide([posePerson('power', 0.50, 0.06)], 'full', 'center', 'recompose'),
  },
  {
    id: 'gd-portrait-thirds', title: 'Off-center portrait', category: 'Guide / Portrait', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: portraitGuide([posePerson('natural', 0.34, 0.08, 'right')], 'three-quarter', 'right', 'recompose'),
  },

  // Food — official public list: overhead flat-lays, off-center plates, plate + glass, spreads, cocktails.
  {
    id: 'gd-food-flatlay', title: 'Overhead flat-lay', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([
      { center: { x: 0.50, y: 0.52 }, rx: 0.29, ry: 0.22, label: 'HERO' },
      { center: { x: 0.24, y: 0.28 }, rx: 0.12, ry: 0.10, label: 'SIDE' },
      { center: { x: 0.78, y: 0.73 }, rx: 0.10, ry: 0.09, label: 'DETAIL' },
    ]),
  },
  {
    id: 'gd-food-off-center', title: 'Off-center plate', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([{ center: { x: 0.34, y: 0.60 }, rx: 0.28, ry: 0.22, label: 'PLATE' }]),
  },
  {
    id: 'gd-food-plate-glass', title: 'Plate + glass', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([
      { center: { x: 0.40, y: 0.61 }, rx: 0.27, ry: 0.21, label: 'PLATE' },
      { center: { x: 0.73, y: 0.30 }, rx: 0.12, ry: 0.15, label: 'GLASS' },
    ]),
  },
  {
    id: 'gd-food-spread', title: 'Table spread', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([
      { center: { x: 0.34, y: 0.38 }, rx: 0.19, ry: 0.14, label: '1' },
      { center: { x: 0.67, y: 0.37 }, rx: 0.18, ry: 0.14, label: '2' },
      { center: { x: 0.30, y: 0.70 }, rx: 0.16, ry: 0.13, label: '3' },
      { center: { x: 0.65, y: 0.68 }, rx: 0.21, ry: 0.16, label: 'HERO' },
    ]),
  },
  {
    id: 'gd-food-cocktail', title: 'Cocktail + garnish', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([
      { center: { x: 0.40, y: 0.58 }, rx: 0.16, ry: 0.26, label: 'DRINK' },
      { center: { x: 0.68, y: 0.34 }, rx: 0.12, ry: 0.10, label: 'GARNISH' },
    ]),
  },
  {
    id: 'gd-food-triangle', title: 'Three-object triangle', category: 'Guide / Food', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: foodGuide([
      { center: { x: 0.34, y: 0.63 }, rx: 0.22, ry: 0.17, label: 'HERO' },
      { center: { x: 0.68, y: 0.60 }, rx: 0.15, ry: 0.12, label: 'SECOND' },
      { center: { x: 0.62, y: 0.31 }, rx: 0.13, ry: 0.11, label: 'THIRD' },
    ]),
  },

  // Travel — landmark points, big sky, frames, reflections, person + landmark.
  {
    id: 'gd-travel-golden-point', title: 'Landmark golden point', category: 'Guide / Travel', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'point', position: { x: 0.67, y: 0.33 }, label: 'LANDMARK' },
      { type: 'zone', center: { x: 0.31, y: 0.67 }, rx: 0.13, ry: 0.20, label: 'YOU' },
    ]),
  },
  {
    id: 'gd-travel-big-sky', title: 'Big sky', category: 'Guide / Travel', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.05, y: 0.72 }, to: { x: 0.95, y: 0.72 }, label: 'LOW HORIZON' }]),
  },
  {
    id: 'gd-travel-frame', title: 'Frame within frame', category: 'Guide / Travel', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'frame', left: 0.18, top: 0.16, right: 0.82, bottom: 0.84, label: 'FRAME SUBJECT' }]),
  },
  {
    id: 'gd-travel-reflection', title: 'Reflection split', category: 'Guide / Travel', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.05, y: 0.50 }, to: { x: 0.95, y: 0.50 }, label: 'REFLECTION AXIS' }]),
  },
  {
    id: 'gd-travel-you-landmark', title: 'You + landmark', category: 'Guide / Travel', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'zone', center: { x: 0.28, y: 0.66 }, rx: 0.12, ry: 0.20, label: 'YOU' },
      { type: 'zone', center: { x: 0.70, y: 0.40 }, rx: 0.20, ry: 0.28, label: 'LANDMARK' },
    ]),
  },

  // Street — leading lines, walk-in space, near/far, layered scenes.
  {
    id: 'gd-street-leading', title: 'Leading lines', category: 'Guide / Street', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'line', from: { x: 0.05, y: 0.92 }, to: { x: 0.47, y: 0.38 }, label: 'LEAD' },
      { type: 'line', from: { x: 0.95, y: 0.92 }, to: { x: 0.53, y: 0.38 } },
      { type: 'point', position: { x: 0.50, y: 0.38 }, label: 'SUBJECT' },
    ]),
  },
  {
    id: 'gd-street-walk-in', title: 'Walk-in space', category: 'Guide / Street', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'zone', center: { x: 0.72, y: 0.62 }, rx: 0.12, ry: 0.24, label: 'WALKER' },
      { type: 'line', from: { x: 0.60, y: 0.62 }, to: { x: 0.18, y: 0.62 }, label: 'WALK INTO SPACE', dashed: true },
    ]),
  },
  {
    id: 'gd-street-near-far', title: 'Near + far pairing', category: 'Guide / Street', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'zone', center: { x: 0.28, y: 0.72 }, rx: 0.20, ry: 0.18, label: 'NEAR' },
      { type: 'zone', center: { x: 0.70, y: 0.35 }, rx: 0.11, ry: 0.15, label: 'FAR' },
    ]),
  },
  {
    id: 'gd-street-layered', title: 'Layered scene', category: 'Guide / Street', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'frame', left: 0.05, top: 0.62, right: 0.95, bottom: 0.95, label: 'FOREGROUND' },
      { type: 'zone', center: { x: 0.50, y: 0.47 }, rx: 0.18, ry: 0.20, label: 'SUBJECT' },
      { type: 'frame', left: 0.08, top: 0.06, right: 0.92, bottom: 0.32, label: 'BACKGROUND' },
    ]),
  },
  {
    id: 'gd-street-diagonal', title: 'Diagonal crossing', category: 'Guide / Street', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'line', from: { x: 0.08, y: 0.84 }, to: { x: 0.90, y: 0.20 }, label: 'DIAGONAL' },
      { type: 'point', position: { x: 0.62, y: 0.42 }, label: 'SUBJECT' },
    ]),
  },

  // Landscape — high/low horizons, foreground anchor, mirror reflections.
  {
    id: 'gd-landscape-low-horizon', title: 'Low horizon', category: 'Guide / Landscape', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.04, y: 0.70 }, to: { x: 0.96, y: 0.70 }, label: 'HORIZON' }]),
  },
  {
    id: 'gd-landscape-high-horizon', title: 'High horizon', category: 'Guide / Landscape', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.04, y: 0.32 }, to: { x: 0.96, y: 0.32 }, label: 'HORIZON' }]),
  },
  {
    id: 'gd-landscape-anchor', title: 'Peak + anchor', category: 'Guide / Landscape', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'point', position: { x: 0.68, y: 0.28 }, label: 'PEAK' },
      { type: 'zone', center: { x: 0.28, y: 0.76 }, rx: 0.18, ry: 0.12, label: 'ANCHOR' },
    ]),
  },
  {
    id: 'gd-landscape-mirror', title: 'Mirror reflection', category: 'Guide / Landscape', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.04, y: 0.50 }, to: { x: 0.96, y: 0.50 }, label: 'MIRROR AXIS' }]),
  },

  // Buildings — symmetry, converging lines, person for scale, frames within frames.
  {
    id: 'gd-building-symmetry', title: 'Building symmetry', category: 'Guide / Buildings', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'line', from: { x: 0.50, y: 0.05 }, to: { x: 0.50, y: 0.95 }, label: 'CENTER AXIS' }]),
  },
  {
    id: 'gd-building-converge', title: 'Converging lines', category: 'Guide / Buildings', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'line', from: { x: 0.06, y: 0.95 }, to: { x: 0.50, y: 0.30 }, label: 'VANISH' },
      { type: 'line', from: { x: 0.94, y: 0.95 }, to: { x: 0.50, y: 0.30 } },
    ]),
  },
  {
    id: 'gd-building-scale', title: 'Person for scale', category: 'Guide / Buildings', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'frame', left: 0.12, top: 0.08, right: 0.88, bottom: 0.92, label: 'BUILDING' },
      { type: 'zone', center: { x: 0.67, y: 0.79 }, rx: 0.07, ry: 0.14, label: 'PERSON' },
    ]),
  },
  {
    id: 'gd-building-frame', title: 'Architectural frame', category: 'Guide / Buildings', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([{ type: 'frame', left: 0.18, top: 0.12, right: 0.82, bottom: 0.88, label: 'FRAME' }]),
  },

  // Basic — thirds and a compact phi-like guide.
  {
    id: 'gd-basic-thirds', title: 'Rule of thirds', category: 'Guide / Basic', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([]),
  },
  {
    id: 'gd-basic-phi', title: 'Golden-ratio focus', category: 'Guide / Basic', inspiredBy: 'reCompose', sourceUrl: RECOMPOSE,
    defaultPreset: 'recompose', guide: sceneGuide([
      { type: 'line', from: { x: 0.382, y: 0.05 }, to: { x: 0.382, y: 0.95 }, label: 'PHI' },
      { type: 'line', from: { x: 0.05, y: 0.382 }, to: { x: 0.95, y: 0.382 } },
      { type: 'point', position: { x: 0.382, y: 0.382 }, label: 'FOCUS' },
    ]),
  },
];

export const BENCHMARK_TEMPLATES: BenchmarkTemplate[] = [
  ...outlineTemplates,
  ...skeletonTemplates,
  ...ghostTemplates,
  ...guideTemplates,
];
