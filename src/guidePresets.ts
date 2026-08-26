import { GuideKind, GuidePreset } from './types';

export type GuidePresetDefinition = {
  key: GuidePreset;
  /** Product-facing mode name: Outline / Skeleton / Ghost / Guide. */
  shortLabel: string;
  /** Benchmark reference only; not the primary product name. */
  benchmarkLabel: string;
  /** Backward-compatible UI alias for benchmarkLabel. */
  label: string;
  description: string;
  layers: string[];
  supportedKinds: GuideKind[];
  benchmarkUrl: string;
};

const mode = (
  key: GuidePreset,
  shortLabel: string,
  benchmarkLabel: string,
  description: string,
  layers: string[],
  supportedKinds: GuideKind[],
  benchmarkUrl: string,
): GuidePresetDefinition => ({
  key, shortLabel, benchmarkLabel, label: benchmarkLabel, description, layers, supportedKinds, benchmarkUrl,
});

/**
 * The product has four display modes. Benchmark brands document the interaction
 * patterns we studied; they are not the primary user-facing taxonomy.
 */
export const GUIDE_PRESETS: GuidePresetDefinition[] = [
  mode(
    'sovs', 'Outline', 'SOVS / SOVS2-like',
    'Clean outside contour. Put the real person inside the silhouette.',
    ['outer contour', 'optional face direction'], ['portrait'],
    'https://apppage.net/preview/me.sovs.sovs2',
  ),
  mode(
    'poseoverlay', 'Skeleton', 'PoseOverlay-like',
    'Explicit body skeleton and joint anchors for precise pose matching.',
    ['skeleton', 'joint anchors', 'face direction'], ['portrait'],
    'https://poseoverlay.com/features/copy-this-pose',
  ),
  mode(
    'poseghost', 'Ghost', 'PoseGhost-like',
    'Semi-transparent filled silhouette that behaves like a pose stencil.',
    ['filled silhouette', 'outer contour'], ['portrait'],
    'https://play.google.com/store/apps/details?id=nz.dev.poseghost',
  ),
  mode(
    'recompose', 'Guide', 'reCompose-like',
    'Semantic composition zones, lines, labels, look space and object relationships.',
    ['composition zones', 'lines / frames', 'labels', 'look space'], ['portrait', 'food', 'scene'],
    'https://recompose.camera/',
  ),
];

export const getGuidePreset = (key: GuidePreset) =>
  GUIDE_PRESETS.find((preset) => preset.key === key) ?? GUIDE_PRESETS[0];
