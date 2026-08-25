export type GuideMode = 'simple' | 'outline' | 'pose';

export type NormalizedPoint = { x: number; y: number };

export type GuideSpec = {
  mode: GuideMode;
  head: { center: NormalizedPoint; rx: number; ry: number; facing: 'left' | 'right' | 'front' };
  shoulders: { left: NormalizedPoint; right: NormalizedPoint };
  torso: { top: NormalizedPoint; bottom: NormalizedPoint; width: number };
  crop: 'headshot' | 'half' | 'three-quarter' | 'full';
  lookSpace: 'left' | 'right' | 'center';
  sourceUri?: string;
};

export const DEFAULT_GUIDE: GuideSpec = {
  mode: 'simple',
  head: { center: { x: 0.54, y: 0.25 }, rx: 0.085, ry: 0.11, facing: 'left' },
  shoulders: { left: { x: 0.38, y: 0.39 }, right: { x: 0.66, y: 0.37 } },
  torso: { top: { x: 0.52, y: 0.40 }, bottom: { x: 0.48, y: 0.77 }, width: 0.26 },
  crop: 'half',
  lookSpace: 'left',
};
