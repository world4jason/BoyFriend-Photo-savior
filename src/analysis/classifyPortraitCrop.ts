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
 * A shoulder must also lie inside the segmented subject's vertical bounds;
 * otherwise the pose/segmentation models disagree too much for that shoulder
 * to be safe crop evidence and we fall back to the segmentation heuristic.
 */
export function classifyPortraitCrop(evidence: PortraitCropEvidence): GuideSpec['crop'] {
  if (evidence.hasAnkle) return 'full';
  if (evidence.hasKnee) return 'three-quarter';
  if (evidence.hasHip) return 'half';

  const hasFiniteSilhouetteBounds = Number.isFinite(evidence.silhouetteTop)
    && Number.isFinite(evidence.silhouetteBottom)
    && evidence.silhouetteBottom > evidence.silhouetteTop;
  const shoulderIsUsable = evidence.shoulderY != null
    && Number.isFinite(evidence.shoulderY)
    && hasFiniteSilhouetteBounds
    && evidence.shoulderY >= evidence.silhouetteTop
    && evidence.shoulderY <= evidence.silhouetteBottom;

  if (shoulderIsUsable) {
    const silhouetteHeight = evidence.silhouetteBottom - evidence.silhouetteTop;
    const belowShoulderRatio = (evidence.silhouetteBottom - evidence.shoulderY!) / silhouetteHeight;
    return belowShoulderRatio <= HEADSHOT_BELOW_SHOULDER_RATIO ? 'headshot' : 'half';
  }

  if (evidence.silhouetteBottom > 0.92) return 'full';
  if (evidence.silhouetteBottom > 0.78) return 'three-quarter';
  if (evidence.silhouetteBottom > 0.58) return 'half';
  return 'headshot';
}
