import { lensHintFromExif, lensHintFromGuide } from '../src/shooting/lensHint';
import type { GuideSpec } from '../src/types';

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function test(name: string, run: () => void) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const exif = (value: unknown) => lensHintFromExif({ FocalLengthIn35mmFilm: value });

test('16mm equivalent maps to 0.5x', () => {
  const hint = exif(16);
  equal(hint?.zoom, 0.5, '16mm zoom');
  equal(hint?.basis, 'exif-35mm', '16mm basis');
  equal(hint?.equivalentMm, 16, '16mm equivalent');
});

test('24mm equivalent maps to 1x', () => {
  equal(exif(24)?.zoom, 1, '24mm zoom');
});

test('50mm equivalent maps to 2x', () => {
  equal(exif(50)?.zoom, 2, '50mm zoom');
});

test('85mm equivalent maps to 3x', () => {
  equal(exif(85)?.zoom, 3, '85mm zoom');
});

test('simple rational EXIF string is accepted', () => {
  const hint = exif('50/1');
  equal(hint?.zoom, 2, 'rational zoom');
  equal(hint?.equivalentMm, 50, 'rational equivalent');
});

test('alternate 35mm-equivalent key is accepted', () => {
  const hint = lensHintFromExif({ FocalLengthIn35mmFormat: '70 mm' });
  equal(hint?.zoom, 3, 'alternate-key zoom');
  equal(hint?.equivalentMm, 70, 'alternate-key equivalent');
});

test('invalid, zero, negative, and non-finite EXIF fail soft', () => {
  equal(lensHintFromExif({ FocalLengthIn35mmFilm: 'not-a-number' }), null, 'invalid string');
  equal(lensHintFromExif({ FocalLengthIn35mmFilm: 0 }), null, 'zero');
  equal(lensHintFromExif({ FocalLengthIn35mmFilm: -50 }), null, 'negative');
  equal(lensHintFromExif({ FocalLengthIn35mmFilm: Number.POSITIVE_INFINITY }), null, 'infinity');
});

const guide = (crop: GuideSpec['crop']): Pick<GuideSpec, 'kind' | 'crop'> => ({ kind: 'portrait', crop });

test('crop fallback remains unchanged when EXIF is unavailable', () => {
  equal(lensHintFromGuide(guide('headshot')).zoom, 3, 'headshot fallback');
  equal(lensHintFromGuide(guide('half')).zoom, 2, 'half fallback');
  equal(lensHintFromGuide(guide('three-quarter')).zoom, 2, 'three-quarter fallback');
  equal(lensHintFromGuide(guide('full')).zoom, 1, 'full fallback');
});

console.log('Lens Hint regression suite passed.');
