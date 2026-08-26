import { GuideKind, GuidePreset } from './types';

export type GuidePresetDefinition = {
  key: GuidePreset;
  label: string;
  shortLabel: string;
  description: string;
  layers: string[];
  supportedKinds: GuideKind[];
  benchmarkUrl: string;
};

/**
 * Product presets are inspired by interaction patterns, not copied product assets.
 * Geometry comes from our own reference analysis / template library.
 */
export const GUIDE_PRESETS: GuidePresetDefinition[] = [
  {
    key: 'sovs',
    label: 'SOVS-like',
    shortLabel: 'Outline',
    description: 'Clean outside contour. Put the real person inside the silhouette.',
    layers: ['outer contour', 'optional face direction'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://apppage.net/preview/me.sovs.sovs2',
  },
  {
    key: 'poseoverlay',
    label: 'PoseOverlay-like',
    shortLabel: 'Skeleton',
    description: 'Explicit body skeleton for precise pose matching and pose coaching.',
    layers: ['skeleton', 'joint anchors', 'face direction'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://poseoverlay.com/features/copy-this-pose',
  },
  {
    key: 'poseghost',
    label: 'PoseGhost-like',
    shortLabel: 'Ghost',
    description: 'Semi-transparent filled silhouette that behaves like a pose stencil.',
    layers: ['filled silhouette', 'outer contour'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://play.google.com/store/apps/details?id=nz.dev.poseghost',
  },
  {
    key: 'recompose',
    label: 'reCompose-like',
    shortLabel: 'Guide',
    description: 'Semantic composition guide: zones, eye lines, look space, object relationships and short hints.',
    layers: ['composition zones', 'grid / lines', 'labels', 'look space'],
    supportedKinds: ['portrait', 'food'],
    benchmarkUrl: 'https://recompose.camera/',
  },
];

export const getGuidePreset = (key: GuidePreset) =>
  GUIDE_PRESETS.find((preset) => preset.key === key) ?? GUIDE_PRESETS[0];
