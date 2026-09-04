import type { GuideSpec } from '../types';

export type PortraitCropEvidence = {
  hasAnkle: boolean;
  hasKnee: boolean;
  hasHip: boolean;
  shoulderY?: number;
  silhouetteTop: number;
  silhouetteBottom: number;
};

const HEADSHOT_BELOW_SHOULDER_RATIO = 0.38;

/**
 * Prefer semantic/trusted lower-body anatomy first. When only trusted shoulder
 * evidence remains, use how much segmented body extends below the shoulder to
 * distinguish a tight head/shoulders crop from a longer upper-body crop.
 *
 * The absolute segmentation-bottom heuristic is reserved for the case where
 * no trusted anatomy is available at all.
 */
export function classifyPortraitCrop(evidence: PortraitCropEvidence): GuideSpec['crop'] {
  if (evidence.hasAnkle) return 'full';
  if (evidence.hasKnee) return 'three-quarter';
  if (evidence.hasHip) return 'half';

  if (evidence.shoulderY != null && Number.isFinite(evidence.shoulderY)) {
    const silhouetteHeight = Math.max(0.001, evidence.silhouetteBottom - evidence.silhouetteTop);
    const belowShoulderRatio = Math.max(0, evidence.silhouetteBottom - evidence.shoulderY) / silhouetteHeight;
    return belowShoulderRatio <= HEADSHOT_BELOW_SHOULDER_RATIO ? 'headshot' : 'half';
  }

  if (evidence.silhouetteBottom > 0.92) return 'full';
  if (evidence.silhouetteBottom > 0.78) return 'three-quarter';
  if (evidence.silhouetteBottom > 0.58) return 'half';
  return 'headshot';
}
