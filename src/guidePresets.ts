import { GuideKind, GuidePreset } from './types';

export type GuidePresetDefinition = {
  key: GuidePreset;
  /** Product-facing mode name: Outline / Skeleton / Ghost / Guide. */
  shortLabel: string;
  /** Benchmark reference only; not the primary product name. */
  benchmarkLabel: string;
  description: string;
  layers: string[];
  supportedKinds: GuideKind[];
  benchmarkUrl: string;
};

/**
 * The product has four display modes. Benchmark brands document the interaction
 * patterns we studied; they are not user-facing feature taxonomy.
 */
export const GUIDE_PRESETS: GuidePresetDefinition[] = [
  {
    key: 'sovs',
    shortLabel: 'Outline',
    benchmarkLabel: 'SOVS / SOVS2-like',
    description: 'Clean outside contour. Put the real person inside the silhouette.',
    layers: ['outer contour', 'optional face direction'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://apppage.net/preview/me.sovs.sovs2',
  },
  {
    key: 'poseoverlay',
    shortLabel: 'Skeleton',
    benchmarkLabel: 'PoseOverlay-like',
    description: 'Explicit body skeleton and joint anchors for precise pose matching.',
    layers: ['skeleton', 'joint anchors', 'face direction'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://poseoverlay.com/features/copy-this-pose',
  },
  {
    key: 'poseghost',
    shortLabel: 'Ghost',
    benchmarkLabel: 'PoseGhost-like',
    description: 'Semi-transparent filled silhouette that behaves like a pose stencil.',
    layers: ['filled silhouette', 'outer contour'],
    supportedKinds: ['portrait'],
    benchmarkUrl: 'https://play.google.com/store/apps/details?id=nz.dev.poseghost',
  },
  {
    key: 'recompose',
    shortLabel: 'Guide',
    benchmarkLabel: 'reCompose-like',
    description: 'Semantic composition zones, lines, labels, look space and object relationships.',
    layers: ['composition zones', 'lines / frames', 'labels', 'look space'],
    supportedKinds: ['portrait', 'food', 'scene'],
    benchmarkUrl: 'https://recompose.camera/',
  },
];

export const getGuidePreset = (key: GuidePreset) =>
  GUIDE_PRESETS.find((preset) => preset.key === key) ?? GUIDE_PRESETS[0];
