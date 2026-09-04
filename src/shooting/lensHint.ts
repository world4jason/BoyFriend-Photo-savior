import type { GuideSpec, LensHint } from '../types';

/**
 * EXIF bridges may return a number, a decimal string, or a rational string.
 * Parse only explicit numeric forms so malformed metadata can never turn into
 * a plausible-but-wrong focal length by stripping arbitrary characters.
 */
const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (!text) return null;

  const numberPattern = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
  const rational = text.match(new RegExp(`^(${numberPattern})\\s*\\/\\s*(${numberPattern})\\s*(?:mm)?$`, 'i'));
  if (rational) {
    const numerator = Number(rational[1]);
    const denominator = Number(rational[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      const parsed = numerator / denominator;
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  const scalar = text.match(new RegExp(`^(${numberPattern})\\s*(?:mm)?$`, 'i'));
  if (!scalar) return null;
  const parsed = Number(scalar[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const zoomFromEquivalentMm = (mm: number): LensHint['zoom'] => {
  if (mm < 20) return 0.5;
  if (mm < 40) return 1;
  if (mm < 70) return 2;
  return 3;
};

export function lensHintFromExif(exif?: Record<string, unknown> | null): LensHint | null {
  if (!exif) return null;
  const candidates = [
    // AndroidX ExifInterface naming.
    exif.FocalLengthIn35mmFilm,
    // Apple ImageIO / CoreGraphics EXIF dictionary naming used by Expo iOS.
    exif.FocalLenIn35mmFilm,
    // Defensive aliases seen in other EXIF bridges/exporters.
    exif.FocalLengthIn35mmFormat,
    exif.FocalLength35mm,
    exif.FocalLengthIn35mm,
  ];
  for (const candidate of candidates) {
    const mm = asFiniteNumber(candidate);
    if (mm != null && mm > 0) {
      return { zoom: zoomFromEquivalentMm(mm), basis: 'exif-35mm', equivalentMm: Math.round(mm) };
    }
  }
  return null;
}

export function lensHintFromGuide(guide: Pick<GuideSpec, 'kind' | 'crop'>): LensHint {
  if (guide.kind === 'food' || guide.kind === 'scene') {
    return { zoom: 1, basis: 'crop-heuristic' };
  }
  switch (guide.crop) {
    case 'headshot':
      return { zoom: 3, basis: 'crop-heuristic' };
    case 'half':
    case 'three-quarter':
      return { zoom: 2, basis: 'crop-heuristic' };
    case 'full':
    default:
      return { zoom: 1, basis: 'crop-heuristic' };
  }
}

export function lensHintLabel(hint?: LensHint | null) {
  if (!hint) return 'Start at 1×';
  return `Start at ${hint.zoom}×`;
}

export function lensHintDetail(hint?: LensHint | null) {
  if (!hint) return 'Use the guide to adjust distance.';
  if (hint.basis === 'exif-35mm' && hint.equivalentMm) {
    return `${hint.equivalentMm}mm equivalent from reference EXIF · then step back/forward until the subject fits.`;
  }
  if (hint.basis === 'template') {
    return 'Template shooting hint · adjust distance until the subject fits.';
  }
  return 'Estimated from framing · adjust distance until the subject fits.';
}
