import type { GuideSpec, LensHint } from '../types';

const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  if (text.includes('/')) {
    const [left, right] = text.split('/').map(Number);
    if (Number.isFinite(left) && Number.isFinite(right) && right !== 0) return left / right;
  }
  const parsed = Number(text.replace(/[^0-9.+-]/g, ''));
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
    exif.FocalLengthIn35mmFilm,
    exif.FocalLengthIn35mmFormat,
    exif.FocalLength35mm,
    exif.FocalLengthIn35mm,
  ];
  for (const candidate of candidates) {
    const mm = asFiniteNumber(candidate);
    if (mm && mm > 0) {
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
