import { BenchmarkPresetKey, DisplayMode, GuideKind } from './types';

export type DisplayModeDefinition = {
  /** Canonical product-facing mode key. */
  key: DisplayMode;
  /** Legacy benchmark-shaped key used by older template data. */
  benchmarkKey: BenchmarkPresetKey;
  shortLabel: string;
  benchmarkLabel: string;
  /** Backward-compatible UI alias for benchmarkLabel. */
  label: string;
  description: string;
  layers: string[];
  supportedKinds: GuideKind[];
  benchmarkUrl: string;
};

export type LegacyGuidePresetDefinition = Omit<DisplayModeDefinition, 'key'> & {
  key: BenchmarkPresetKey;
  displayMode: DisplayMode;
};

const mode = (
  key: DisplayMode,
  benchmarkKey: BenchmarkPresetKey,
  shortLabel: string,
  benchmarkLabel: string,
  description: string,
  layers: string[],
  supportedKinds: GuideKind[],
  benchmarkUrl: string,
): DisplayModeDefinition => ({
  key,
  benchmarkKey,
  shortLabel,
  benchmarkLabel,
  label: benchmarkLabel,
  description,
  layers,
  supportedKinds,
  benchmarkUrl,
});

/** Product display modes. Benchmark brands are provenance, never primary taxonomy. */
export const DISPLAY_MODES: DisplayModeDefinition[] = [
  mode(
    'outline', 'sovs', 'Outline', 'SOVS / SOVS2-like',
    'Clean outside contour. Put the real person inside the silhouette.',
    ['outer contour', 'optional face direction'], ['portrait'],
    'https://apppage.net/preview/me.sovs.sovs2',
  ),
  mode(
    'skeleton', 'poseoverlay', 'Skeleton', 'PoseOverlay-like',
    'Explicit body skeleton and joint anchors for precise pose matching.',
    ['skeleton', 'joint anchors', 'face direction'], ['portrait'],
    'https://poseoverlay.com/features/copy-this-pose',
  ),
  mode(
    'ghost', 'poseghost', 'Ghost', 'PoseGhost-like',
    'Semi-transparent filled silhouette that behaves like a pose stencil.',
    ['filled silhouette', 'outer contour'], ['portrait'],
    'https://play.google.com/store/apps/details?id=nz.dev.poseghost',
  ),
  mode(
    'guide', 'recompose', 'Guide', 'reCompose-like',
    'Semantic composition zones, lines, labels, look space and object relationships.',
    ['composition zones', 'lines / frames', 'labels', 'look space'], ['portrait', 'food', 'scene'],
    'https://recompose.camera/',
  ),
];

const LEGACY_TO_MODE: Record<BenchmarkPresetKey, DisplayMode> = {
  sovs: 'outline',
  poseoverlay: 'skeleton',
  poseghost: 'ghost',
  recompose: 'guide',
};

export const resolveDisplayMode = (value?: DisplayMode | BenchmarkPresetKey | null): DisplayMode => {
  if (!value) return 'outline';
  if (value === 'outline' || value === 'skeleton' || value === 'ghost' || value === 'guide') return value;
  return LEGACY_TO_MODE[value];
};

export const legacyBenchmarkKeyForMode = (displayMode: DisplayMode): BenchmarkPresetKey =>
  DISPLAY_MODES.find((modeDefinition) => modeDefinition.key === displayMode)?.benchmarkKey ?? 'sovs';

export const getDisplayMode = (value?: DisplayMode | BenchmarkPresetKey | null) => {
  const key = resolveDisplayMode(value);
  return DISPLAY_MODES.find((modeDefinition) => modeDefinition.key === key) ?? DISPLAY_MODES[0];
};

/**
 * Compatibility view for App/template code that still stores benchmark-shaped keys.
 * New code should prefer DISPLAY_MODES + DisplayMode.
 */
export const GUIDE_PRESETS: LegacyGuidePresetDefinition[] = DISPLAY_MODES.map((modeDefinition) => ({
  ...modeDefinition,
  key: modeDefinition.benchmarkKey,
  displayMode: modeDefinition.key,
}));

/** Accepts either canonical DisplayMode or a legacy benchmark key. */
export const getGuidePreset = getDisplayMode;
