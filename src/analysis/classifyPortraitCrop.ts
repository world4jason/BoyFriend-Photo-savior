import type { GuideSpec } from '../types';

export type PortraitCropEvidence = {
  hasAnkle: boolean;
  hasKnee: boolean;
  hasHip: boolean;
  hasArm: boolean;
  hasUpperPose: boolean;
  silhouetteBottom: number;
};

/**
 * Prefer semantic/trusted anatomy over the segmentation silhouette touching
 * the frame edge. The bottom-position heuristic is only a fail-soft fallback
 * for references where pose anatomy is unavailable.
 */
export function classifyPortraitCrop(evidence: PortraitCropEvidence): GuideSpec['crop'] {
  if (evidence.hasAnkle) return 'full';
  if (evidence.hasKnee) return 'three-quarter';
  if (evidence.hasHip) return 'half';
  if (evidence.hasArm) return 'half';
  if (evidence.hasUpperPose) return 'headshot';

  if (evidence.silhouetteBottom > 0.92) return 'full';
  if (evidence.silhouetteBottom > 0.78) return 'three-quarter';
  if (evidence.silhouetteBottom > 0.58) return 'half';
  return 'headshot';
}
